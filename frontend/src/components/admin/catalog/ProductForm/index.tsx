"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";

import RichTextEditor from "@/components/admin/RichTextEditor";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { getImageUrlWithFallback } from "@/lib/utils/images";
import { useToast } from "@/hooks/useToast";

import { getBrands, type Brand } from "@/lib/apis/brands";
import { getCategories, type Category } from "@/lib/apis/categories";
import { getAttributes, type Attribute } from "@/lib/apis/attributes";
import { getWarehouses, type Warehouse } from "@/lib/apis/inventory";
import {
  createProduct,
  updateProduct,
  type CreateProductData,
  type CreateProductVariantData,
  type Product,
  type ProductVariantAttributeValue,
  type UpdateProductData,
  type UpdateProductVariantData,
} from "@/lib/apis/products";

import {
  buildProductSchema,
  mapServerErrors,
  slugify,
  type ProductFormValues,
  type SimplePricingValue,
  type VariantFormValue,
} from "./schema";
import {
  Card,
  Checkbox,
  ErrorSummary,
  Select,
  StickyActionBar,
  TextArea,
  TextInput,
} from "./primitives";
import { MediaSection, type ImageItem } from "./MediaSection";
import { CategoriesSection } from "./CategoriesSection";
import { VariantsSection } from "./VariantsSection";
import { InventoryGrid } from "./InventoryGrid";

interface ValidationError {
  message: string;
  errors?: Record<string, string[]>;
}

type Mode = "create" | "edit";

interface ProductFormProps {
  mode: Mode;
  productId?: number;
  initialProduct?: Product;
}

const LIST_HREF = "/admin/catalog/products";

export default function ProductForm({
  mode,
  productId,
  initialProduct,
}: ProductFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [refDataLoaded, setRefDataLoaded] = useState(false);

  const [images, setImages] = useState<ImageItem[]>(() => {
    if (!initialProduct?.images) return [];
    const out: ImageItem[] = [];
    for (const img of initialProduct.images) {
      const url = getImageUrlWithFallback(img.url, img.path_original);
      if (!url) continue;
      out.push({ type: "existing", id: img.id, url, preview: url });
    }
    return out;
  });
  const [primaryIndex, setPrimaryIndex] = useState<number>(() => {
    const idx = initialProduct?.images?.findIndex((i) => i.is_primary) ?? -1;
    return idx >= 0 ? idx : 0;
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const schema = useMemo(
    () => buildProductSchema({ attributes }),
    [attributes]
  );

  const defaultValues: ProductFormValues = useMemo(() => {
    if (mode === "edit" && initialProduct) {
      const firstVar = initialProduct.variants?.[0];
      const productType = (initialProduct.product_type || "simple") as
        | "simple"
        | "variant"
        | "bundle";
      const variants: VariantFormValue[] =
        productType === "variant" && initialProduct.variants
          ? initialProduct.variants.map((v) => {
              const attrValues =
                v.attributeValues ||
                ((v as unknown as { attribute_values?: ProductVariantAttributeValue[] })
                  .attribute_values ??
                  []);
              return {
                id: v.id,
                sku: v.sku,
                price: Number(v.price),
                compare_at_price: v.compare_at_price ?? null,
                cost_price: v.cost_price ?? null,
                currency: v.currency,
                track_stock: v.track_stock,
                allow_backorder: v.allow_backorder,
                status: v.status,
                attribute_values: attrValues.map((av) => ({
                  attribute_id: av.attribute_id,
                  attribute_value_id: av.attribute_value_id,
                })),
                inventory: [],
              };
            })
          : [];
      const simplePricing: SimplePricingValue | undefined =
        productType === "simple"
          ? {
              variant_id: firstVar?.id ?? null,
              sku: firstVar?.sku ?? "",
              price: Number(firstVar?.price ?? 0),
              compare_at_price: firstVar?.compare_at_price ?? null,
              cost_price: firstVar?.cost_price ?? null,
              track_stock: firstVar?.track_stock ?? true,
              allow_backorder: firstVar?.allow_backorder ?? false,
              status: firstVar?.status ?? "active",
              currency: firstVar?.currency ?? "BDT",
              inventory: [],
            }
          : undefined;
      return {
        name: initialProduct.name,
        slug: initialProduct.slug ?? "",
        description: initialProduct.description ?? "",
        short_description: initialProduct.short_description ?? "",
        product_type: productType,
        brand_id: initialProduct.brand_id ?? null,
        published_status: (initialProduct.published_status || "draft") as
          | "draft"
          | "published"
          | "archived",
        is_active: initialProduct.is_active ?? true,
        is_featured: initialProduct.is_featured ?? false,
        is_upcoming: initialProduct.is_upcoming ?? false,
        call_for_price: initialProduct.call_for_price ?? false,
        categories: initialProduct.categories?.map((c) => c.id) ?? [],
        simple_pricing: simplePricing,
        variants,
      };
    }
    return {
      name: "",
      slug: "",
      description: "",
      short_description: "",
      product_type: "simple",
      brand_id: null,
      published_status: "draft",
      is_active: true,
      is_featured: false,
      is_upcoming: false,
      call_for_price: false,
      categories: [],
      simple_pricing: {
        variant_id: null,
        sku: "",
        price: 0,
        compare_at_price: null,
        cost_price: null,
        track_stock: true,
        allow_backorder: false,
        status: "active",
        currency: "BDT",
        inventory: [],
      },
      variants: [],
    };
  }, [mode, initialProduct]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, dirtyFields, submitCount },
    setError,
    watch,
    setValue,
    getValues,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues,
  });

  const productType = watch("product_type");
  const selectedCategories = watch("categories") ?? [];
  const variants = watch("variants") ?? [];
  const simplePricing = watch("simple_pricing");
  const nameValue = watch("name") ?? "";
  const shortDescValue = watch("short_description") ?? "";

  // Slug auto-gen: only when slug never user-edited.
  const slugManual = useRef<boolean>(
    Boolean(defaultValues.slug && defaultValues.slug.length > 0)
  );
  useEffect(() => {
    if (slugManual.current) return;
    const next = slugify(nameValue);
    setValue("slug", next, { shouldDirty: false, shouldValidate: false });
  }, [nameValue, setValue]);

  // Fetch reference data
  useEffect(() => {
    const load = async () => {
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;
        const [b, c, a, w] = await Promise.all([
          getBrands(token, { size: 100 }),
          getCategories(token, {
            size: 100,
            include_all: true,
            with_children: true,
          }),
          getAttributes(token, { size: 100, with_values: true }),
          getWarehouses({ size: 100 }),
        ]);
        setBrands(b.data);
        setCategories(c.data);
        setAttributes(a.data);
        setWarehouses(w.data);
      } catch (err) {
        console.error("Failed to load reference data", err);
        toast.error("Failed to load form data", "Refresh and try again.");
      } finally {
        setRefDataLoaded(true);
      }
    };
    load();
  }, [toast]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.type === "new" && img.preview.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setVariants = (
    next:
      | VariantFormValue[]
      | ((prev: VariantFormValue[]) => VariantFormValue[])
  ) => {
    const value =
      typeof next === "function" ? next(getValues("variants") ?? []) : next;
    setValue("variants", value, { shouldDirty: true, shouldValidate: true });
  };

  const setSimplePricing = (patch: Partial<SimplePricingValue>) => {
    const cur = getValues("simple_pricing") || ({} as SimplePricingValue);
    setValue(
      "simple_pricing",
      { ...cur, ...patch },
      { shouldDirty: true, shouldValidate: true }
    );
  };

  const onValid = async (values: ProductFormValues) => {
    setServerError(null);
    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setServerError("Not authenticated.");
        toast.error("Not authenticated", "Sign in again.");
        return;
      }

      const newImageFiles = images
        .filter((i): i is Extract<ImageItem, { type: "new" }> => i.type === "new")
        .map((i) => i.file)
        .filter((f) => f instanceof File && f.size > 0);

      // Build variants payload from form state.
      let payloadVariants: CreateProductVariantData[] | undefined;
      if (values.product_type === "simple" && values.simple_pricing) {
        const sp = values.simple_pricing;
        const inv =
          sp.inventory && sp.inventory.length > 0
            ? sp.inventory.filter(
                (i) =>
                  i.on_hand !== undefined ||
                  i.safety_stock !== undefined ||
                  i.reorder_point !== undefined
              )
            : [];
        const inventoryForSimple =
          inv.length > 0
            ? inv
            : warehouses.map((w) => ({ warehouse_id: w.id, on_hand: 0 }));
        payloadVariants = [
          {
            ...(mode === "edit" && sp.variant_id ? { id: sp.variant_id } : {}),
            sku: sp.sku.trim(),
            price: sp.price,
            compare_at_price: sp.compare_at_price ?? null,
            cost_price: sp.cost_price ?? null,
            currency: sp.currency || "BDT",
            track_stock: sp.track_stock ?? true,
            allow_backorder: sp.allow_backorder ?? false,
            status: sp.status || "active",
            attribute_values: [],
            inventory: inventoryForSimple,
          } as CreateProductVariantData & { id?: number },
        ];
      } else if (values.product_type === "variant") {
        payloadVariants = (values.variants || []).map((v) => ({
          ...(v.id ? { id: v.id } : {}),
          sku: v.sku.trim(),
          price: v.price,
          compare_at_price: v.compare_at_price ?? null,
          cost_price: v.cost_price ?? null,
          currency: v.currency || "BDT",
          track_stock: v.track_stock ?? true,
          allow_backorder: v.allow_backorder ?? false,
          status: v.status || "active",
          attribute_values: v.attribute_values ?? [],
          inventory: v.inventory ?? [],
        })) as CreateProductVariantData[];
      }

      const existingIdsInOrder = images
        .filter((i): i is Extract<ImageItem, { type: "existing" }> => i.type === "existing")
        .map((i) => i.id);

      const baseData = {
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        short_description: values.short_description || undefined,
        product_type: values.product_type,
        brand_id: values.brand_id && values.brand_id > 0 ? values.brand_id : null,
        published_status: values.published_status,
        is_active: values.is_active ?? true,
        is_featured: values.is_featured ?? false,
        is_upcoming: values.is_upcoming ?? false,
        call_for_price: values.call_for_price ?? false,
        categories:
          values.categories && values.categories.length > 0
            ? values.categories
            : [],
        variants: payloadVariants,
      };

      if (mode === "create") {
        await createProduct(
          token,
          baseData as CreateProductData,
          newImageFiles.length > 0 ? newImageFiles : undefined,
          newImageFiles.length > 0 ? { primaryIndex } : undefined
        );
        toast.success("Product created");
        router.push(LIST_HREF);
        return;
      }

      // edit
      if (!productId) throw new Error("Missing productId for edit mode");

      const originalIds = initialProduct?.images?.map((i) => i.id) || [];
      const originalPrimary =
        initialProduct?.images?.findIndex((i) => i.is_primary) ?? -1;
      const imagesChanged =
        newImageFiles.length > 0 ||
        JSON.stringify(originalIds) !== JSON.stringify(existingIdsInOrder) ||
        primaryIndex !== (originalPrimary >= 0 ? originalPrimary : 0);

      await updateProduct(
        token,
        productId,
        baseData as UpdateProductData & {
          variants?: UpdateProductVariantData[];
        },
        imagesChanged && newImageFiles.length > 0 ? newImageFiles : undefined,
        imagesChanged
          ? { primaryIndex, existingImageIds: existingIdsInOrder }
          : undefined
      );
      toast.success("Product updated");
      router.refresh();
    } catch (err) {
      console.error("Product save failed", err);
      if (err instanceof AxiosError && err.response) {
        const data = err.response.data as ValidationError;
        if (data?.errors) {
          mapServerErrors(data.errors, (path, e) =>
            setError(path as never, e)
          );
        }
        const msg = data?.message || `Save failed (${err.response.status}).`;
        setServerError(msg);
        toast.error("Could not save", msg);
      } else if (err instanceof AxiosError && err.request) {
        const msg = "Network error. Check your connection.";
        setServerError(msg);
        toast.error("Network error", msg);
      } else {
        const msg = "An unexpected error occurred.";
        setServerError(msg);
        toast.error("Unexpected error", msg);
      }
    }
  };

  const onInvalid = () => {
    toast.error(
      "Please fix the highlighted issues",
      "Scroll to the top to see what's missing."
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={LIST_HREF}
          className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
          aria-label="Back to products"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {mode === "create" ? "Create product" : "Edit product"}
          </h1>
          <p className="text-sm text-gray-500">
            {mode === "create"
              ? "Add a new product to your catalog."
              : initialProduct?.name
                ? `Update ${initialProduct.name}.`
                : "Update product information."}
          </p>
        </div>
      </div>

      {(submitCount > 0 && Object.keys(errors).length > 0) || serverError ? (
        <ErrorSummary errors={errors} serverMessage={serverError} />
      ) : null}

      <form onSubmit={handleSubmit(onValid, onInvalid)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main column */}
          <div className="space-y-6">
            <Card title="Basics" description="Identify and describe the product.">
              <div className="space-y-4">
                <TextInput
                  label="Product name"
                  required
                  id="name"
                  placeholder="Enter product name"
                  {...register("name")}
                  error={errors.name?.message}
                />
                <TextInput
                  label="Slug"
                  id="slug"
                  placeholder="auto-generated-from-name"
                  {...register("slug", {
                    onChange: () => {
                      slugManual.current = true;
                    },
                  })}
                  hint={
                    slugManual.current
                      ? "Manual override active."
                      : "Auto-generated from name. Edit to override."
                  }
                  rightAdornment={
                    !slugManual.current ? (
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        AUTO
                      </span>
                    ) : null
                  }
                  error={errors.slug?.message}
                />
                <TextArea
                  label="Short description"
                  id="short_description"
                  rows={2}
                  placeholder="Brief excerpt shown in lists and search results"
                  counter={{ value: shortDescValue.length, max: 500 }}
                  {...register("short_description")}
                  error={errors.short_description?.message}
                />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Description
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                        placeholder="Full product description"
                        error={errors.description?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </Card>

            {productType === "simple" ? (
              <Card title="Pricing & inventory" description="Set the price and starting stock.">
                <div className="space-y-4">
                  <TextInput
                    label="SKU"
                    required
                    id="simple_pricing.sku"
                    value={simplePricing?.sku ?? ""}
                    onChange={(e) => setSimplePricing({ sku: e.target.value })}
                    placeholder="e.g., PRODUCT-001"
                    error={
                      (errors.simple_pricing as { sku?: { message?: string } })
                        ?.sku?.message
                    }
                  />
                  <div className="grid gap-3 md:grid-cols-3">
                    <TextInput
                      label="Price"
                      required
                      id="simple_pricing.price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={simplePricing?.price ?? ""}
                      onChange={(e) =>
                        setSimplePricing({
                          price: e.target.value === "" ? 0 : Number(e.target.value),
                        })
                      }
                      error={
                        (
                          errors.simple_pricing as {
                            price?: { message?: string };
                          }
                        )?.price?.message
                      }
                    />
                    <TextInput
                      label="Compare-at"
                      id="simple_pricing.compare_at_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={simplePricing?.compare_at_price ?? ""}
                      onChange={(e) =>
                        setSimplePricing({
                          compare_at_price:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      error={
                        (
                          errors.simple_pricing as {
                            compare_at_price?: { message?: string };
                          }
                        )?.compare_at_price?.message
                      }
                    />
                    <TextInput
                      label="Cost"
                      id="simple_pricing.cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={simplePricing?.cost_price ?? ""}
                      onChange={(e) =>
                        setSimplePricing({
                          cost_price:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-800">
                      Initial inventory by warehouse
                    </p>
                    <InventoryGrid
                      warehouses={warehouses}
                      inventory={simplePricing?.inventory || []}
                      onChange={(next) => setSimplePricing({ inventory: next })}
                    />
                  </div>
                </div>
              </Card>
            ) : null}

            {productType === "variant" ? (
              <VariantsSection
                variants={variants}
                setVariants={setVariants}
                attributes={attributes}
                warehouses={warehouses}
                errors={errors}
                hideExistingInventory={mode === "edit"}
              />
            ) : null}

            <MediaSection
              images={images}
              setImages={setImages}
              primaryIndex={primaryIndex}
              setPrimaryIndex={setPrimaryIndex}
            />
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-6 lg:h-fit">
            <Card title="Publish" description="Visibility and product flags.">
              <div className="space-y-4">
                <Select
                  label="Status"
                  id="published_status"
                  {...register("published_status")}
                  error={errors.published_status?.message}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
                <Select
                  label="Product type"
                  id="product_type"
                  {...register("product_type")}
                  hint={
                    productType === "variant"
                      ? "Multiple SKUs (size/color)."
                      : productType === "bundle"
                        ? "A grouping of other products."
                        : "Single SKU."
                  }
                  error={errors.product_type?.message}
                >
                  <option value="simple">Simple</option>
                  <option value="variant">Variant</option>
                  <option value="bundle">Bundle</option>
                </Select>
                <Select
                  label="Brand"
                  id="brand_id"
                  {...register("brand_id", {
                    setValueAs: (v) => (v === "" ? null : Number(v)),
                  })}
                  error={errors.brand_id?.message}
                >
                  <option value="">No brand</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <Checkbox
                    id="flag_active"
                    label="Active"
                    description="Available for sale"
                    {...register("is_active")}
                  />
                  <Checkbox
                    id="flag_featured"
                    label="Featured"
                    description="Highlighted on homepage"
                    {...register("is_featured")}
                  />
                  <Checkbox
                    id="flag_upcoming"
                    label="Upcoming"
                    description="Coming soon — pre-order"
                    {...register("is_upcoming")}
                  />
                  <Checkbox
                    id="flag_call"
                    label="Call for price"
                    description="Hide price; show contact"
                    {...register("call_for_price")}
                  />
                </div>
              </div>
            </Card>

            <CategoriesSection
              categories={categories}
              selected={selectedCategories}
              onChange={(next) =>
                setValue("categories", next, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </aside>
        </div>

        <StickyActionBar
          isSubmitting={isSubmitting}
          isDirty={isDirty || Object.keys(dirtyFields).length > 0}
          cancelHref={LIST_HREF}
          submitLabel={mode === "create" ? "Create product" : "Save changes"}
          submittingLabel={mode === "create" ? "Creating..." : "Saving..."}
        />
      </form>

      {!refDataLoaded ? (
        <p className="text-xs text-gray-400">Loading reference data…</p>
      ) : null}
    </div>
  );
}
