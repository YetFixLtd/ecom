"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  createProduct,
  type CreateProductData,
  type CreateProductVariantData,
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
import { Plus, Trash2, Edit2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Product name is required."),
  slug: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  product_type: z.enum(["simple", "variant", "bundle"]),
  brand_id: z.number().nullable().optional(),
  published_status: z.enum(["draft", "published", "archived"]),
  is_active: z.boolean().optional(),
  categories: z.array(z.number()).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

export default function CreateProductPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [variants, setVariants] = useState<CreateProductVariantData[]>([]);
  const [editingVariantIndex, setEditingVariantIndex] = useState<number | null>(
    null
  );
  // Simple product pricing state
  const [simpleProductPricing, setSimpleProductPricing] = useState({
    sku: "",
    price: 0,
    compare_at_price: null as number | null,
    cost_price: null as number | null,
  });
  // Simple product inventory state (per warehouse)
  const [simpleInventory, setSimpleInventory] = useState<
    VariantInventoryData[]
  >([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_type: "simple",
      published_status: "draft",
      is_active: true,
      categories: [],
    },
  });

  const selectedCategories = watch("categories") || [];
  const productType = watch("product_type");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;

        const [brandsRes, categoriesRes, attributesRes, warehousesRes] =
          await Promise.all([
            getBrands(token, { size: 100 }),
            getCategories(token, {
              size: 100,
              include_all: true,
              with_children: true,
            }),
            getAttributes(token, { size: 100, with_values: true }),
            getWarehouses({ size: 100 }),
          ]);

        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);
        setAttributes(attributesRes.data);
        setWarehouses(warehousesRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).filter(
        (file) => file instanceof File
      ) as File[];

      // Check total image count doesn't exceed 3
      if (selectedImages.length + newFiles.length > 3) {
        setServerError(
          `Maximum 3 images allowed. You have ${
            selectedImages.length
          } images and trying to add ${newFiles.length} new (total would be ${
            selectedImages.length + newFiles.length
          }).`
        );
        e.target.value = ""; // Reset input
        return;
      }

      // Validate each file before adding
      const validFiles: File[] = [];
      const errors: string[] = [];
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];

      newFiles.forEach((file) => {
        // Check file size (5MB = 5120KB)
        if (file.size > maxSize) {
          errors.push(
            `${file.name}: File size (${(file.size / 1024 / 1024).toFixed(
              2
            )}MB) exceeds the 5MB limit.`
          );
          return;
        }

        // Check file type
        if (!allowedTypes.includes(file.type)) {
          errors.push(
            `${file.name}: Invalid file type (${file.type}). Only JPEG, PNG, and WebP are allowed.`
          );
          return;
        }

        validFiles.push(file);
      });

      if (errors.length > 0) {
        setServerError(errors.join(" "));
        e.target.value = ""; // Reset input
        return;
      }

      // Append new files to existing selected images
      const updatedFiles = [...selectedImages, ...validFiles];
      const updatedPreviews = [
        ...imagePreviews,
        ...validFiles.map((file) => URL.createObjectURL(file)),
      ];

      setSelectedImages(updatedFiles);
      setImagePreviews(updatedPreviews);
      setServerError(null);
      e.target.value = ""; // Reset input to allow selecting same file again
    }
  };

  const removeImage = (index: number) => {
    // Revoke blob URL
    if (imagePreviews[index]?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Move image up in order
  const moveImageUp = (index: number) => {
    if (index === 0) return; // Can't move first item up
    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviews];
    [newImages[index - 1], newImages[index]] = [
      newImages[index],
      newImages[index - 1],
    ];
    [newPreviews[index - 1], newPreviews[index]] = [
      newPreviews[index],
      newPreviews[index - 1],
    ];
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Move image down in order
  const moveImageDown = (index: number) => {
    if (index === selectedImages.length - 1) return; // Can't move last item down
    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviews];
    [newImages[index], newImages[index + 1]] = [
      newImages[index + 1],
      newImages[index],
    ];
    [newPreviews[index], newPreviews[index + 1]] = [
      newPreviews[index + 1],
      newPreviews[index],
    ];
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
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

  // Update inventory for simple products (per warehouse)
  const updateSimpleInventory = (
    warehouseId: number,
    updates: { on_hand?: number; safety_stock?: number; reorder_point?: number }
  ) => {
    setSimpleInventory((prev) => {
      const existingIndex = prev.findIndex(
        (inv) => inv.warehouse_id === warehouseId
      );
      let updated: VariantInventoryData[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...updates };
      } else {
        updated = [...prev, { warehouse_id: warehouseId, ...updates }];
      }
      return updated;
    });
  };

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setServerError("Not authenticated");
        return;
      }

      // Ensure we have actual File objects - verify they're valid before proceeding
      const imageFiles = selectedImages.filter(
        (img) => img instanceof File && img.size > 0
      ) as File[];

      if (
        selectedImages.length > 0 &&
        imageFiles.length !== selectedImages.length
      ) {
        setServerError(
          "Some image files are invalid. Please select valid image files."
        );
        setIsSubmitting(false);
        return;
      }

      // Verify files are still File objects right before sending
      const validFiles = imageFiles.filter(
        (f) => f instanceof File && f.size > 0
      );
      console.log(
        "Files to send:",
        validFiles.map((f) => ({
          name: f.name,
          size: f.size,
          type: f.type,
          isFile: f instanceof File,
          constructor: f.constructor.name,
        }))
      );

      // Validate and prepare variants based on product type
      let validVariants: CreateProductVariantData[] | undefined = undefined;
      if (values.product_type === "variant") {
        if (variants.length === 0) {
          setServerError(
            "At least one variant is required for variant products."
          );
          setIsSubmitting(false);
          return;
        }

        // Filter out incomplete variants and validate
        validVariants = variants.filter((variant) => {
          // Must have SKU
          if (!variant.sku || variant.sku.trim() === "") {
            return false;
          }
          // Must have price
          if (!variant.price || variant.price <= 0) {
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
      } else if (values.product_type === "simple") {
        // For simple products, create a single variant with pricing
        if (
          !simpleProductPricing.sku ||
          simpleProductPricing.sku.trim() === ""
        ) {
          setServerError("SKU is required for simple products.");
          setIsSubmitting(false);
          return;
        }
        if (!simpleProductPricing.price || simpleProductPricing.price <= 0) {
          setServerError(
            "Price is required and must be greater than 0 for simple products."
          );
          setIsSubmitting(false);
          return;
        }
        // Clean up simple inventory (only send warehouses where at least one field is set)
        const cleanedInventory =
          simpleInventory.length > 0
            ? simpleInventory.filter(
                (inv) =>
                  inv.on_hand !== undefined ||
                  inv.safety_stock !== undefined ||
                  inv.reorder_point !== undefined
              )
            : undefined;
        validVariants = [
          {
            sku: simpleProductPricing.sku.trim(),
            price: simpleProductPricing.price,
            compare_at_price: simpleProductPricing.compare_at_price || null,
            cost_price: simpleProductPricing.cost_price || null,
            track_stock: true,
            allow_backorder: false,
            status: "active",
            attribute_values: [], // Simple products don't have attribute values
            inventory: cleanedInventory,
          },
        ];
      }

      const productData: CreateProductData = {
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        short_description: values.short_description || undefined,
        product_type: values.product_type,
        brand_id:
          values.brand_id && values.brand_id > 0 ? values.brand_id : null,
        published_status: values.published_status,
        is_active: values.is_active ?? true,
        categories:
          values.categories && values.categories.length > 0
            ? values.categories
            : undefined,
        variants: validVariants,
      };

      // Pass images as a separate parameter to avoid serialization issues
      await createProduct(
        token,
        productData,
        validFiles.length > 0 ? validFiles : undefined
      );
      router.push("/admin/catalog/products");
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof AxiosError && error.response) {
        console.error("Error response:", error.response.data);
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

        setServerError(data.message || "Failed to create product.");
      } else {
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
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  // Variant management functions
  const addVariant = () => {
    const newVariant: CreateProductVariantData = {
      sku: "",
      price: 0,
      track_stock: true,
      allow_backorder: false,
      status: "active",
      attribute_values: [],
      inventory: [],
    };
    setVariants([...variants, newVariant]);
    setEditingVariantIndex(variants.length);
  };

  const updateVariant = (
    index: number,
    updates: Partial<CreateProductVariantData>
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

  const updateVariantInventory = (
    variantIndex: number,
    warehouseId: number,
    updates: { on_hand?: number; safety_stock?: number; reorder_point?: number }
  ) => {
    const variant = variants[variantIndex];
    const inventory = variant.inventory || [];
    const existing = inventory.findIndex(
      (inv) => inv.warehouse_id === warehouseId
    );

    let updated: typeof inventory;
    if (existing >= 0) {
      updated = [...inventory];
      updated[existing] = { ...updated[existing], ...updates };
    } else {
      updated = [...inventory, { warehouse_id: warehouseId, ...updates }];
    }

    updateVariant(variantIndex, { inventory: updated });
  };

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
            <h1 className="text-2xl font-semibold">Create Product</h1>
            <p className="text-sm text-gray-600">
              Add a new product to your catalog
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

            {/* Pricing - Only show if product type is simple */}
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
                        setSimpleProductPricing({
                          ...simpleProductPricing,
                          sku: e.target.value,
                        })
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
                        value={simpleProductPricing.price || ""}
                        onChange={(e) =>
                          setSimpleProductPricing({
                            ...simpleProductPricing,
                            price: e.target.value ? Number(e.target.value) : 0,
                          })
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
                        value={simpleProductPricing.compare_at_price || ""}
                        onChange={(e) =>
                          setSimpleProductPricing({
                            ...simpleProductPricing,
                            compare_at_price: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
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
                        value={simpleProductPricing.cost_price || ""}
                        onChange={(e) =>
                          setSimpleProductPricing({
                            ...simpleProductPricing,
                            cost_price: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {/* Simple product inventory by warehouse */}
                  {warehouses.length > 0 && (
                    <div className="mt-4 rounded-md border p-3">
                      <label className="mb-2 block text-sm font-medium">
                        Initial Inventory by Warehouse
                      </label>
                      <div className="space-y-2">
                        {warehouses.map((warehouse) => {
                          const inv =
                            simpleInventory.find(
                              (i) => i.warehouse_id === warehouse.id
                            ) || ({} as VariantInventoryData);
                          return (
                            <div
                              key={warehouse.id}
                              className="grid grid-cols-3 gap-2"
                            >
                              <div className="text-xs text-gray-600">
                                {warehouse.name}
                              </div>
                              <input
                                type="number"
                                placeholder="On Hand"
                                value={inv.on_hand ?? ""}
                                onChange={(e) =>
                                  updateSimpleInventory(warehouse.id, {
                                    on_hand: e.target.value
                                      ? Number(e.target.value)
                                      : undefined,
                                  })
                                }
                                className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                              />
                              <div className="flex gap-1">
                                <input
                                  type="number"
                                  placeholder="Safety"
                                  value={inv.safety_stock ?? ""}
                                  onChange={(e) =>
                                    updateSimpleInventory(warehouse.id, {
                                      safety_stock: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  className="flex-1 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                                <input
                                  type="number"
                                  placeholder="Reorder"
                                  value={inv.reorder_point ?? ""}
                                  onChange={(e) =>
                                    updateSimpleInventory(warehouse.id, {
                                      reorder_point: e.target.value
                                        ? Number(e.target.value)
                                        : undefined,
                                    })
                                  }
                                  className="flex-1 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                        key={index}
                        className="rounded-md border border-gray-200 p-4"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-medium">Variant {index + 1}</h3>
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
                                value={variant.sku}
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
                                  value={variant.price}
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

                              {/* Warehouse Inventory */}
                              {variant.track_stock && warehouses.length > 0 && (
                                <div className="mt-3 rounded-md border p-3">
                                  <label className="mb-2 block text-sm font-medium">
                                    Initial Inventory by Warehouse
                                  </label>
                                  <div className="space-y-2">
                                    {warehouses.map((warehouse) => {
                                      const inv = variant.inventory?.find(
                                        (i) => i.warehouse_id === warehouse.id
                                      );
                                      return (
                                        <div
                                          key={warehouse.id}
                                          className="grid grid-cols-3 gap-2"
                                        >
                                          <div className="text-xs text-gray-600">
                                            {warehouse.name}
                                          </div>
                                          <input
                                            type="number"
                                            placeholder="On Hand"
                                            value={inv?.on_hand || ""}
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
                                            className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                                          />
                                          <div className="flex gap-1">
                                            <input
                                              type="number"
                                              placeholder="Safety"
                                              value={inv?.safety_stock || ""}
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
                                              className="flex-1 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            />
                                            <input
                                              type="number"
                                              placeholder="Reorder"
                                              value={inv?.reorder_point || ""}
                                              onChange={(e) =>
                                                updateVariantInventory(
                                                  index,
                                                  warehouse.id,
                                                  {
                                                    reorder_point: e.target
                                                      .value
                                                      ? Number(e.target.value)
                                                      : undefined,
                                                  }
                                                )
                                              }
                                              className="flex-1 rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                                            />
                                          </div>
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
                            <div>Price: ${variant.price}</div>
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
                    Upload images. They will be appended to any existing images.
                    You can rearrange them below.
                  </p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm hover:bg-gray-50">
                    <Upload className="h-4 w-4" />
                    Choose Images
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

                {imagePreviews.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      Images ({imagePreviews.length}/3) - Use arrows to reorder
                    </p>
                    <div className="space-y-3">
                      {imagePreviews.map((preview, index) => (
                        <div
                          key={index}
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
                              disabled={index === imagePreviews.length - 1}
                              className="rounded p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                          <img
                            src={preview}
                            alt={`Image ${index + 1}`}
                            className="h-20 w-20 rounded-md object-cover"
                            onError={() => {
                              // If preview fails to load, try recreating blob URL from file
                              const file = selectedImages[index];
                              if (file && preview.startsWith("blob:")) {
                                URL.revokeObjectURL(preview);
                                const newPreview = URL.createObjectURL(file);
                                setImagePreviews((prev) => {
                                  const newPreviews = [...prev];
                                  newPreviews[index] = newPreview;
                                  return newPreviews;
                                });
                              }
                            }}
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Image {index + 1}
                            </p>
                            <p className="text-xs text-gray-500">
                              Position: {index + 1}
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
                    id="is_active"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Active
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
            {isSubmitting ? "Creating..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
