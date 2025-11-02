"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload, X, ChevronRight, ChevronDown } from "lucide-react";
import {
  updateProduct,
  getProduct,
  type UpdateProductData,
  type Product,
} from "@/lib/apis/products";
import { getBrands, type Brand } from "@/lib/apis/brands";
import { getCategories, type Category } from "@/lib/apis/categories";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import Link from "next/link";

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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );

  const {
    register,
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

  // Fetch product and related data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;

        const [productRes, brandsRes, categoriesRes] = await Promise.all([
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
        ]);

        setProduct(productRes.data);
        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);

        // Pre-fill form with product data
        const productData = productRes.data;
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
          categories: productData.categories?.map((cat) => cat.id) || [],
        });

        // Set existing images as previews if available
        if (productData.images && productData.images.length > 0) {
          const imageUrls = productData.images.map(
            (img) => img.url || img.path_original || ""
          );
          setImagePreviews(imageUrls.filter(Boolean));
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
      const files = Array.from(e.target.files)
        .slice(0, 3)
        .filter((file) => file instanceof File) as File[];

      console.log(
        "Selected files:",
        files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
      );

      // Revoke old preview URLs before setting new ones
      setImagePreviews((prev) => {
        prev.forEach((url) => {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        });
        return files.map((file) => URL.createObjectURL(file));
      });

      setSelectedImages(files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke blob URLs
    if (imagePreviews[index]?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviews[index]);
    }

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
        // Always send categories array (even if empty)
        categories:
          values.categories !== undefined
            ? values.categories
            : product?.categories?.map((c) => c.id) || [],
      };

      // Only include images if new ones were selected
      if (validFiles.length > 0) {
        updateData.images = validFiles;
      }

      await updateProduct(
        token,
        productId,
        updateData,
        validFiles.length > 0 ? validFiles : undefined
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
      imagePreviews.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imagePreviews]);

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
                  <textarea
                    {...register("description")}
                    rows={6}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Full product description"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="rounded-lg border bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold">Product Images</h2>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Replace Images (Max 3)
                  </label>
                  <p className="mb-2 text-xs text-gray-500">
                    Upload new images to replace existing ones. Leave empty to
                    keep current images.
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

                {/* Existing Images */}
                {product.images && product.images.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Current Images:</p>
                    <div className="grid grid-cols-3 gap-4">
                      {product.images.map((img) => (
                        <div key={img.id} className="relative">
                          <img
                            src={
                              img.url || img.path_original || img.path_medium
                            }
                            alt={img.alt_text || product.name}
                            className="h-32 w-full rounded-md object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Image Previews */}
                {imagePreviews.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium">
                      New Images (will replace existing):
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="h-32 w-full rounded-md object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
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
