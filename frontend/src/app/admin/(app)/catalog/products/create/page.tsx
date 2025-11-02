"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload, X, ChevronRight, ChevronDown } from "lucide-react";
import { createProduct, type CreateProductData } from "@/lib/apis/products";
import { getBrands, type Brand } from "@/lib/apis/brands";
import { getCategories, type Category } from "@/lib/apis/categories";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import Link from "next/link";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;

        const [brandsRes, categoriesRes] = await Promise.all([
          getBrands(token, { size: 100 }),
          getCategories(token, {
            size: 100,
            include_all: true,
            with_children: true,
          }),
        ]);

        setBrands(brandsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error("Failed to fetch brands/categories:", error);
      }
    };

    fetchData();
  }, []);

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
        prev.forEach((url) => URL.revokeObjectURL(url));
        return files.map((file) => URL.createObjectURL(file));
      });

      setSelectedImages(files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
    // Revoke object URLs to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
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
                    Upload Images (Max 3)
                  </label>
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
