"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Upload,
  X,
  ChevronRight,
  ChevronDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  updateProduct,
  getProduct,
  deleteProductImage,
  type UpdateProductData,
  type UpdateProductVariantData,
  type Product,
  type ProductVariant,
  type ProductVariantAttributeValue,
  type VariantInventoryData,
} from "@/lib/apis/products";
import { getBrands, type Brand } from "@/lib/apis/brands";
import { getCategories, type Category } from "@/lib/apis/categories";
import { getAttributes, type Attribute } from "@/lib/apis/attributes";
import { getWarehouses, type Warehouse } from "@/lib/apis/inventory";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { getImageUrlWithFallback } from "@/lib/utils/images";
import { Plus, Trash2, Edit2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Product name is required."),
  slug: z.string().optional(),
  description: z.string().optional(),
  short_description: z
    .string()
    .max(500, "Short description must be 500 characters or less.")
    .optional(),
  product_type: z.enum(["simple", "variant", "bundle"]).optional(),
  brand_id: z.number().nullable().optional(),
  published_status: z.enum(["draft", "published", "archived"]).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_upcoming: z.boolean().optional(),
  call_for_price: z.boolean().optional(),
  categories: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [variants, setVariants] = useState<UpdateProductVariantData[]>([]);
  const [simpleProductPricing, setSimpleProductPricing] = useState<{
    variant_id: number | null;
    sku: string;
    price: number | null;
    compare_at_price: number | null;
    cost_price: number | null;
    track_stock: boolean;
    allow_backorder: boolean;
    status: UpdateProductVariantData["status"];
    currency: string;
  }>({
    variant_id: null,
    sku: "",
    price: null,
    compare_at_price: null,
    cost_price: null,
    track_stock: true,
    allow_backorder: false,
    status: "active",
    currency: "USD",
  });
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );
  // Unified image list - combines existing and new images for easier reordering
  type ImageItem =
    | { type: "existing"; id: number; url: string; preview: string }
    | { type: "new"; file: File; preview: string; tempId: string }; // Use tempId instead of index for stable keys

  const [allImages, setAllImages] = useState<ImageItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  // Update inventory for NEW variants (those without an id) per warehouse
  const updateVariantInventory = (
    variantIndex: number,
    warehouseId: number,
    updates: {
      on_hand?: number;
      safety_stock?: number;
      reorder_point?: number;
    }
  ) => {
    setVariants((prev) => {
      const updated = [...prev];
      const variant = updated[variantIndex];
      const currentInventory = (variant.inventory ||
        []) as VariantInventoryData[];
      const existingIndex = currentInventory.findIndex(
        (inv) => inv.warehouse_id === warehouseId
      );

      let newInventory: VariantInventoryData[];
      if (existingIndex >= 0) {
        newInventory = [...currentInventory];
        newInventory[existingIndex] = {
          ...newInventory[existingIndex],
          ...updates,
        };
      } else {
        newInventory = [
          ...currentInventory,
          { warehouse_id: warehouseId, ...updates },
        ];
      }

      updated[variantIndex] = {
        ...variant,
        inventory: newInventory,
      };
      return updated;
    });
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const selectedCategories = watch("categories") || [];
  const productType = watch("product_type");

  // Fetch product and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;

        const [
          productRes,
          brandsRes,
          categoriesRes,
          attributesRes,
          warehousesRes,
        ] = await Promise.all([
          getProduct(token, productId, {
            with_variants: true,
            with_inventory: false,
          }),
          getBrands(token, { size: 100 }),
          getCategories(token, {
            size: 100,
            include_all: true,
            with_children: true,
          }),
          getAttributes(token, { size: 100, with_values: true }),
          getWarehouses({ size: 100 }),
        ]);

        const productData = productRes.data;
        setProduct(productData);
        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);
        setAttributes(attributesRes.data);
        setWarehouses(warehousesRes.data);

        // Load existing variants
        if (productData.variants && productData.variants.length > 0) {
          const existingVariants: UpdateProductVariantData[] =
            productData.variants.map((v) => {
              // Handle both camelCase and snake_case from API
              const attrValues =
                v.attributeValues ||
                (v as { attribute_values?: ProductVariantAttributeValue[] })
                  .attribute_values ||
                [];
              return {
                id: v.id,
                sku: v.sku,
                price: v.price,
                compare_at_price: v.compare_at_price,
                cost_price: v.cost_price,
                currency: v.currency,
                track_stock: v.track_stock,
                allow_backorder: v.allow_backorder,
                status: v.status,
                attribute_values:
                  attrValues.length > 0
                    ? attrValues.map((av) => ({
                        attribute_id: av.attribute_id,
                        attribute_value_id: av.attribute_value_id,
                      }))
                    : [],
              };
            });
          setVariants(existingVariants);

          if (
            productData.product_type === "simple" &&
            productData.variants.length > 0
          ) {
            const simpleVariant = productData.variants[0];
            setSimpleProductPricing({
              variant_id: simpleVariant.id ?? null,
              sku: simpleVariant.sku ?? "",
              price: simpleVariant.price ?? null,
              compare_at_price: simpleVariant.compare_at_price ?? null,
              cost_price: simpleVariant.cost_price ?? null,
              track_stock:
                simpleVariant.track_stock !== undefined
                  ? simpleVariant.track_stock
                  : true,
              allow_backorder:
                simpleVariant.allow_backorder !== undefined
                  ? simpleVariant.allow_backorder
                  : false,
              status:
                (simpleVariant.status as UpdateProductVariantData["status"]) ||
                "active",
              currency: simpleVariant.currency || "USD",
            });
          }
        } else {
          // Ensure simple pricing has defaults even if no variant exists yet
          if (productData.product_type === "simple") {
            setSimpleProductPricing((prev) => ({
              ...prev,
              sku: prev.sku || "",
              price: prev.price ?? null,
            }));
          }
        }

        // Pre-fill form with product data
        reset({
          name: productData.name,
          slug: productData.slug,
          description: productData.description || "",
          short_description: productData.short_description || "",
          product_type: productData.product_type as
            | "simple"
            | "variant"
            | "bundle",
          brand_id: productData.brand_id,
          published_status: productData.published_status as
            | "draft"
            | "published"
            | "archived",
          is_active: productData.is_active,
          is_featured: productData.is_featured ?? false,
          is_upcoming: productData.is_upcoming ?? false,
          call_for_price: productData.call_for_price ?? false,
          categories: productData.categories?.map((cat) => cat.id) || [],
        });

        // Store existing images in unified list
        if (productData.images && productData.images.length > 0) {
          const existing: ImageItem[] = productData.images
            .map((img) => {
              const url = getImageUrlWithFallback(img.url, img.path_original);
              if (!url) return null;
              return {
                type: "existing" as const,
                id: img.id,
                url,
                preview: url,
              } as ImageItem;
            })
            .filter((img): img is ImageItem => img !== null);
          setAllImages(existing);
        }
      } catch (error) {
        console.error("Failed to fetch product data:", error);
        setServerError("Failed to load product. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchData();
    }
  }, [productId, reset]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        (file) => file instanceof File
      ) as File[];

      // Check total image count doesn't exceed 3
      if (allImages.length + newFiles.length > 3) {
        setServerError(
          `Maximum 3 images allowed. You have ${
            allImages.length
          } images and trying to add ${newFiles.length} new (total would be ${
            allImages.length + newFiles.length
          }).`
        );
        e.target.value = ""; // Reset input
        return;
      }

      // Append new files to unified image list
      const newImageItems: ImageItem[] = newFiles.map((file) => ({
        type: "new" as const,
        file,
        preview: URL.createObjectURL(file),
        tempId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Unique ID for React key
      }));

      setAllImages((prev) => [...prev, ...newImageItems]);
      setServerError(null);
      e.target.value = ""; // Reset input to allow selecting same file again
    }
  };

  // Remove image from unified list
  const removeImage = (index: number) => {
    const item = allImages[index];
    // Revoke blob URLs for new images
    if (item.type === "new" && item.preview.startsWith("blob:")) {
      URL.revokeObjectURL(item.preview);
    }
    setAllImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Move image up in order
  const moveImageUp = (index: number) => {
    if (index === 0) return; // Can't move first item up
    setAllImages((prev) => {
      const newImages = [...prev];
      // Preserve all properties including preview URLs when swapping
      const temp = newImages[index - 1];
      newImages[index - 1] = newImages[index];
      newImages[index] = temp;
      return newImages;
    });
  };

  // Move image down in order
  const moveImageDown = (index: number) => {
    setAllImages((prev) => {
      if (index === prev.length - 1) return prev; // Can't move last item down
      const newImages = [...prev];
      // Preserve all properties including preview URLs when swapping
      const temp = newImages[index];
      newImages[index] = newImages[index + 1];
      newImages[index + 1] = temp;
      return newImages;
    });
  };

  const handleCategoryChange = (categoryId: number, checked: boolean) => {
    const current = selectedCategories;
    if (checked) {
      setValue("categories", [...current, categoryId]);
    } else {
      setValue(
        "categories",
        current.filter((id) => id !== categoryId)
      );
    }
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setServerError("Not authenticated");
        setIsSubmitting(false);
        return;
      }

      // Extract new image files from unified list
      const newImageFiles = allImages
        .filter((img) => img.type === "new")
        .map((img) => (img.type === "new" ? img.file : null))
        .filter((file): file is File => file instanceof File && file.size > 0);

      // Check if images were changed (removed, added, or reordered)
      const originalImageIds =
        product?.images?.map((img) => img.id).sort() || [];
      const currentExistingIds = allImages
        .filter((img) => img.type === "existing")
        .map((img) => (img.type === "existing" ? img.id : 0))
        .sort();
      const imagesChanged =
        newImageFiles.length > 0 ||
        JSON.stringify(originalImageIds) !== JSON.stringify(currentExistingIds);

      // Build update data - ALWAYS send all current form values explicitly
      // This ensures the backend receives all fields for update
      const updateData: UpdateProductData = {
        // Always send name (required field)
        name: values.name || product?.name || "",
        // Send slug if provided, otherwise send current slug or empty string
        slug: values.slug !== undefined ? values.slug : product?.slug ?? "",
        // Always send description (even if empty, to allow clearing it)
        description:
          values.description !== undefined
            ? values.description
            : product?.description ?? "",
        // Always send short_description
        short_description:
          values.short_description !== undefined
            ? values.short_description
            : product?.short_description ?? "",
        // Always send product_type (required field)
        product_type: (values.product_type ||
          product?.product_type ||
          "simple") as "simple" | "variant" | "bundle",
        // Send brand_id (can be null)
        brand_id:
          values.brand_id !== undefined
            ? values.brand_id
            : product?.brand_id ?? null,
        // Always send published_status
        published_status: (values.published_status ||
          product?.published_status ||
          "draft") as "draft" | "published" | "archived",
        // Always send is_active (boolean)
        is_active:
          values.is_active !== undefined
            ? values.is_active
            : product?.is_active ?? true,
        // Always send is_featured (boolean)
        is_featured:
          values.is_featured !== undefined
            ? values.is_featured
            : product?.is_featured ?? false,
        // Always send is_upcoming (boolean)
        is_upcoming:
          values.is_upcoming !== undefined
            ? values.is_upcoming
            : product?.is_upcoming ?? false,
        // Always send call_for_price (boolean)
        call_for_price:
          values.call_for_price !== undefined
            ? values.call_for_price
            : product?.call_for_price ?? false,
        // Always send categories array (even if empty)
        categories:
          values.categories !== undefined
            ? values.categories
            : product?.categories?.map((c) => c.id) || [],
      };

      // Handle image deletions first (existing images that were removed)
      if (product?.images) {
        const imagesToDelete = product.images.filter(
          (img) =>
            !allImages.some(
              (item) => item.type === "existing" && item.id === img.id
            )
        );

        // Delete removed images via API
        for (const img of imagesToDelete) {
          try {
            await deleteProductImage(token, productId, img.id);
          } catch (error) {
            console.error(`Failed to delete image ${img.id}:`, error);
            // Continue even if deletion fails
          }
        }
      }

      // Send new images in the order they appear (existing + new)
      // Note: Backend currently replaces all images, so we need to send all final images
      // For now, we'll send only new images and the backend will append them
      // TODO: Update backend to support image reordering without replacing all
      if (imagesChanged && newImageFiles.length > 0) {
        updateData.images = newImageFiles;
      }

      // Handle simple product pricing
      if (productType === "simple") {
        if (
          !simpleProductPricing.sku ||
          simpleProductPricing.sku.trim() === ""
        ) {
          setServerError("SKU is required for simple products.");
          setIsSubmitting(false);
          return;
        }
        if (
          simpleProductPricing.price === null ||
          simpleProductPricing.price === undefined ||
          simpleProductPricing.price <= 0
        ) {
          setServerError(
            "Price is required and must be greater than 0 for simple products."
          );
          setIsSubmitting(false);
          return;
        }

        updateData.variants = [
          {
            id: simpleProductPricing.variant_id ?? undefined,
            sku: simpleProductPricing.sku.trim(),
            price: simpleProductPricing.price,
            compare_at_price: simpleProductPricing.compare_at_price,
            cost_price: simpleProductPricing.cost_price,
            currency:
              simpleProductPricing.currency ||
              product?.variants?.[0]?.currency ||
              "USD",
            track_stock: simpleProductPricing.track_stock,
            allow_backorder: simpleProductPricing.allow_backorder,
            status: simpleProductPricing.status || "active",
            attribute_values: [],
          },
        ];
      }

      // Validate and add variants if product type is variant
      // Only send variants if product type is variant AND variants exist
      // If variants exist, validate them; otherwise don't send them (backend will handle missing variants)
      if (productType === "variant" && variants.length > 0) {
        // Filter out incomplete variants and validate
        const validVariants = variants.filter((variant) => {
          // Must have SKU (required for both new and existing variants)
          if (!variant.sku || variant.sku.trim() === "") {
            return false;
          }
          // Must have price
          if (
            variant.price === undefined ||
            variant.price === null ||
            variant.price <= 0
          ) {
            return false;
          }
          // Attribute values are optional - no validation needed
          return true;
        });

        // Check if any variants were filtered out
        if (validVariants.length === 0) {
          setServerError("All variants must have SKU and price.");
          setIsSubmitting(false);
          return;
        }

        // Check if some variants were filtered out
        if (validVariants.length < variants.length) {
          setServerError(
            `Only ${validVariants.length} of ${variants.length} variant(s) are complete. Please complete all variants before submitting.`
          );
          setIsSubmitting(false);
          return;
        }

        updateData.variants = validVariants;
      }
      // If product type is variant but no variants exist, don't send variants array
      // Backend validation will handle this case

      await updateProduct(
        token,
        productId,
        updateData,
        imagesChanged && newImageFiles.length > 0 ? newImageFiles : undefined
      );

      router.push("/admin/catalog/products");
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof AxiosError && error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        const data = error.response.data as ValidationError;

        if (data.errors) {
          Object.keys(data.errors).forEach((field) => {
            const fieldErrors = data.errors?.[field];
            if (fieldErrors && fieldErrors.length > 0) {
              const fieldName = field
                .replace(/\.\d+\./g, ".")
                .replace(/\./g, "_") as keyof FormValues;
              setError(fieldName, {
                type: "server",
                message: fieldErrors[0],
              });
            }
          });
        }

        setServerError(
          data.message ||
            `Failed to update product. Status: ${error.response.status}`
        );
      } else if (error instanceof AxiosError && error.request) {
        console.error("Network error:", error.request);
        setServerError(
          "Network error. Please check your connection and try again."
        );
      } else {
        console.error("Unexpected error:", error);
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const rootCategories = categories.filter((cat) => !cat.parent_id);

  const getChildren = (parentId: number) =>
    categories.filter((cat) => cat.parent_id === parentId);

  const toggleExpand = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryTree = (category: Category, level = 0) => {
    const children = getChildren(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = selectedCategories.includes(category.id);

    return (
      <div key={category.id}>
        <label
          className={`flex items-center gap-2 rounded-md p-2 hover:bg-gray-50 ${
            isSelected ? "bg-blue-50" : ""
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                toggleExpand(category.id);
              }}
              className="rounded p-0.5 hover:bg-gray-200"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-600" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) =>
              handleCategoryChange(category.id, e.target.checked)
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm flex-1">{category.name}</span>
        </label>
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {children.map((child) => renderCategoryTree(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      allImages.forEach((img) => {
        if (img.type === "new" && img.preview.startsWith("blob:")) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [allImages]);

  // Variant management functions
  const addVariant = () => {
    const newVariant: UpdateProductVariantData = {
      sku: "",
      price: 0,
      track_stock: true,
      allow_backorder: false,
      status: "active",
      attribute_values: [],
    };
    setVariants([...variants, newVariant]);
    setEditingVariantIndex(variants.length);
  };

  const updateVariant = (
    index: number,
    updates: Partial<UpdateProductVariantData>
  ) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], ...updates };
    setVariants(updated);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
    if (editingVariantIndex === index) {
      setEditingVariantIndex(null);
    } else if (editingVariantIndex !== null && editingVariantIndex > index) {
      setEditingVariantIndex(editingVariantIndex - 1);
    }
  };

  const updateVariantAttribute = (
    variantIndex: number,
    attributeId: number,
    valueId: number | null
  ) => {
    const variant = variants[variantIndex];
    const currentValues = variant.attribute_values || [];
    const filtered = currentValues.filter(
      (av) => av.attribute_id !== attributeId
    );
    const updated = valueId
      ? [
          ...filtered,
          { attribute_id: attributeId, attribute_value_id: valueId },
        ]
      : filtered;
    updateVariant(variantIndex, { attribute_values: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-gray-500">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Product not found
        </div>
        <Link
          href="/admin/catalog/products"
          className="text-blue-600 hover:underline"
        >
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/catalog/products"
            className="rounded-md p-1 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Edit Product</h1>
            <p className="text-sm text-gray-600">
              Update product information and settings
            </p>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Basic Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Product Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Enter product name"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Slug</label>
                  <input
                    type="text"
                    {...register("slug")}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Auto-generated if empty"
                  />
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.slug.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Short Description
                  </label>
                  <textarea
                    {...register("short_description")}
                    rows={2}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Brief product description (max 500 characters)"
                  />
                  {errors.short_description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.short_description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
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
            </div>

            {/* Simple Product Pricing */}
            {productType === "simple" && (
              <div className="rounded-lg border bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold">Pricing</h2>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={simpleProductPricing.sku}
                      onChange={(e) =>
                        setSimpleProductPricing((prev) => ({
                          ...prev,
                          sku: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      placeholder="e.g., PRODUCT-001"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Price <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={simpleProductPricing.price ?? ""}
                        onChange={(e) =>
                          setSimpleProductPricing((prev) => ({
                            ...prev,
                            price: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Compare At Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={simpleProductPricing.compare_at_price ?? ""}
                        onChange={(e) =>
                          setSimpleProductPricing((prev) => ({
                            ...prev,
                            compare_at_price: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Cost Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={simpleProductPricing.cost_price ?? ""}
                        onChange={(e) =>
                          setSimpleProductPricing((prev) => ({
                            ...prev,
                            cost_price: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Variants - Only show if product type is variant */}
            {productType === "variant" && (
              <div className="rounded-lg border bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Product Variants</h2>
                  <button
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Add Variant
                  </button>
                </div>

                {variants.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No variants added yet. Click &quot;Add Variant&quot; to
                    create one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {variants.map((variant, index) => (
                      <div
                        key={variant.id || index}
                        className="rounded-md border border-gray-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-medium">
                            Variant {index + 1}
                            {variant.id && (
                              <span className="ml-2 text-xs text-gray-500">
                                (ID: {variant.id})
                              </span>
                            )}
                          </h3>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingVariantIndex(
                                  editingVariantIndex === index ? null : index
                                )
                              }
                              className="rounded-md p-1 text-gray-600 hover:bg-gray-100"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="rounded-md p-1 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {editingVariantIndex === index ? (
                          <div className="space-y-4">
                            {/* SKU */}
                            <div>
                              <label className="mb-1 block text-sm font-medium">
                                SKU <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={variant.sku || ""}
                                onChange={(e) =>
                                  updateVariant(index, { sku: e.target.value })
                                }
                                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                placeholder="e.g., PRODUCT-RED-L"
                              />
                            </div>

                            {/* Attribute Values */}
                            {attributes.length > 0 && (
                              <div>
                                <label className="mb-2 block text-sm font-medium">
                                  Attribute Values
                                </label>
                                <div className="space-y-2">
                                  {attributes.map((attr) => {
                                    const selectedValue =
                                      variant.attribute_values?.find(
                                        (av) => av.attribute_id === attr.id
                                      );
                                    return (
                                      <div key={attr.id}>
                                        <label className="mb-1 block text-xs text-gray-600">
                                          {attr.name}
                                        </label>
                                        <select
                                          value={
                                            selectedValue?.attribute_value_id ||
                                            ""
                                          }
                                          onChange={(e) =>
                                            updateVariantAttribute(
                                              index,
                                              attr.id,
                                              e.target.value
                                                ? Number(e.target.value)
                                                : null
                                            )
                                          }
                                          className="w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                        >
                                          <option value="">
                                            Select {attr.name}
                                          </option>
                                          {attr.values?.map((val) => (
                                            <option key={val.id} value={val.id}>
                                              {val.value}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Pricing */}
                            <div className="grid gap-4 md:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Price <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.price || 0}
                                  onChange={(e) =>
                                    updateVariant(index, {
                                      price: Number(e.target.value),
                                    })
                                  }
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Compare At Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.compare_at_price || ""}
                                  onChange={(e) =>
                                    updateVariant(index, {
                                      compare_at_price: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    })
                                  }
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-medium">
                                  Cost Price
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={variant.cost_price || ""}
                                  onChange={(e) =>
                                    updateVariant(index, {
                                      cost_price: e.target.value
                                        ? Number(e.target.value)
                                        : null,
                                    })
                                  }
                                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                />
                              </div>
                            </div>

                            {/* Inventory Settings */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={variant.track_stock ?? true}
                                    onChange={(e) =>
                                      updateVariant(index, {
                                        track_stock: e.target.checked,
                                      })
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-sm">Track Stock</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={variant.allow_backorder ?? false}
                                    onChange={(e) =>
                                      updateVariant(index, {
                                        allow_backorder: e.target.checked,
                                      })
                                    }
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                  />
                                  <span className="text-sm">
                                    Allow Backorder
                                  </span>
                                </label>
                              </div>

                              {/* Initial inventory by warehouse - only for NEW variants */}
                              {!variant.id &&
                                (variant.track_stock ?? true) &&
                                warehouses.length > 0 && (
                                  <div className="mt-3 rounded-md border p-3">
                                    <label className="mb-3 block text-sm font-medium">
                                      Initial Inventory by Warehouse
                                    </label>
                                    <div className="space-y-3">
                                      {/* Header row */}
                                      <div className="grid grid-cols-4 gap-3 border-b pb-2">
                                        <div className="text-xs font-medium text-gray-700">
                                          Warehouse
                                        </div>
                                        <div className="text-xs font-medium text-gray-700">
                                          On Hand
                                        </div>
                                        <div className="text-xs font-medium text-gray-700">
                                          Safety
                                        </div>
                                        <div className="text-xs font-medium text-gray-700">
                                          Reorder
                                        </div>
                                      </div>
                                      {/* Warehouse rows */}
                                      {warehouses.map((warehouse) => {
                                        const inv =
                                          (
                                            variant.inventory as
                                              | VariantInventoryData[]
                                              | undefined
                                          )?.find(
                                            (i) =>
                                              i.warehouse_id === warehouse.id
                                          ) || ({} as VariantInventoryData);
                                        return (
                                          <div
                                            key={warehouse.id}
                                            className="grid grid-cols-4 gap-3 items-center"
                                          >
                                            <div className="text-sm text-gray-700">
                                              {warehouse.name}
                                            </div>
                                            <input
                                              type="number"
                                              step="0.01"
                                              placeholder="0.00"
                                              value={inv.on_hand ?? ""}
                                              onChange={(e) =>
                                                updateVariantInventory(
                                                  index,
                                                  warehouse.id,
                                                  {
                                                    on_hand: e.target.value
                                                      ? Number(e.target.value)
                                                      : undefined,
                                                  }
                                                )
                                              }
                                              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            />
                                            <input
                                              type="number"
                                              step="0.01"
                                              placeholder="0.00"
                                              value={inv.safety_stock ?? ""}
                                              onChange={(e) =>
                                                updateVariantInventory(
                                                  index,
                                                  warehouse.id,
                                                  {
                                                    safety_stock: e.target.value
                                                      ? Number(e.target.value)
                                                      : undefined,
                                                  }
                                                )
                                              }
                                              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            />
                                            <input
                                              type="number"
                                              step="0.01"
                                              placeholder="0.00"
                                              value={inv.reorder_point ?? ""}
                                              onChange={(e) =>
                                                updateVariantInventory(
                                                  index,
                                                  warehouse.id,
                                                  {
                                                    reorder_point: e.target.value
                                                      ? Number(e.target.value)
                                                      : undefined,
                                                  }
                                                )
                                              }
                                              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                                            />
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                            </div>

                            <button
                              type="button"
                              onClick={() => setEditingVariantIndex(null)}
                              className="rounded-md bg-gray-100 px-3 py-1.5 text-sm hover:bg-gray-200"
                            >
                              Done Editing
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            <div>SKU: {variant.sku || "Not set"}</div>
                            <div>Price: ${variant.price || 0}</div>
                            {variant.attribute_values &&
                              variant.attribute_values.length > 0 && (
                                <div>
                                  Attributes:{" "}
                                  {variant.attribute_values
                                    .map((av) => {
                                      const attr = attributes.find(
                                        (a) => a.id === av.attribute_id
                                      );
                                      if (!attr) return "";
                                      const val = attr.values?.find(
                                        (v) => v.id === av.attribute_value_id
                                      );
                                      return val
                                        ? `${attr.name}: ${val.value}`
                                        : "";
                                    })
                                    .filter(Boolean)
                                    .join(", ")}
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Product Images */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Product Images</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Upload Images (Max 3 total)
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    Upload new images. They will be added to existing images.
                    You can rearrange them below.
                  </p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Choose New Images
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      max={3}
                    />
                  </label>
                </div>

                {/* All Images (Existing + New) with Reorder Controls */}
                {allImages.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Images ({allImages.length}/3) - Use arrows to reorder
                    </p>
                    <div className="space-y-3">
                      {allImages.map((img, index) => (
                        <div
                          key={
                            img.type === "existing"
                              ? `existing-${img.id}`
                              : `new-${img.tempId}`
                          }
                          className="flex items-center gap-3 rounded-md border p-2"
                        >
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => moveImageUp(index)}
                              disabled={index === 0}
                              className="rounded p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImageDown(index)}
                              disabled={index === allImages.length - 1}
                              className="rounded p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                          <img
                            src={img.preview}
                            alt={`Image ${index + 1}`}
                            className="h-20 w-20 rounded-md object-cover"
                            onError={() => {
                              // If image fails to load and it's a new image, try recreating blob URL
                              if (img.type === "new") {
                                const newPreview = URL.createObjectURL(
                                  img.file
                                );
                                setAllImages((prev) =>
                                  prev.map((item, idx) =>
                                    idx === index && item.type === "new"
                                      ? { ...item, preview: newPreview }
                                      : item
                                  )
                                );
                                // Revoke the old URL
                                if (img.preview.startsWith("blob:")) {
                                  URL.revokeObjectURL(img.preview);
                                }
                              }
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {img.type === "existing"
                                ? `Existing Image ${index + 1}`
                                : `New Image ${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {img.type === "existing"
                                ? `ID: ${img.id}`
                                : `Position: ${index + 1}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Product Settings */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Product Type
                  </label>
                  <select
                    {...register("product_type")}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="simple">Simple</option>
                    <option value="variant">Variant</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Status
                  </label>
                  <select
                    {...register("published_status")}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Brand
                  </label>
                  <select
                    {...register("brand_id", {
                      setValueAs: (v) => (v === "" ? null : Number(v)),
                    })}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">No Brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("is_active")}
                    id="is_active_edit"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label
                    htmlFor="is_active_edit"
                    className="text-sm font-medium"
                  >
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("is_featured")}
                    id="is_featured_edit"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label
                    htmlFor="is_featured_edit"
                    className="text-sm font-medium"
                  >
                    Featured
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("is_upcoming")}
                    id="is_upcoming_edit"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label
                    htmlFor="is_upcoming_edit"
                    className="text-sm font-medium"
                  >
                    Upcoming Product
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("call_for_price")}
                    id="call_for_price_edit"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label
                    htmlFor="call_for_price_edit"
                    className="text-sm font-medium"
                  >
                    Call for Price
                  </label>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Categories</h2>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
                {rootCategories.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">
                    No categories available
                  </p>
                ) : (
                  rootCategories.map((category) => renderCategoryTree(category))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link
            href="/admin/catalog/products"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
