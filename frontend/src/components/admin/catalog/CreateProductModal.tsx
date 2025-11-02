"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Upload } from "lucide-react";
import { createProduct, type CreateProductData } from "@/lib/apis/products";
import { getBrands, type Brand } from "@/lib/apis/brands";
import { getCategories, type Category } from "@/lib/apis/categories";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z.object({
  name: z.string().min(1, "Product name is required."),
  slug: z.string().optional(),
  description: z.string().optional(),
  short_description: z.string().max(500).optional(),
  product_type: z.enum(["simple", "variant", "bundle"]),
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

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProductModal({ onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;

        const [brandsRes, categoriesRes] = await Promise.all([
          getBrands(token, { size: 100 }),
          getCategories(token, { size: 100, include_all: true }),
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
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3);
      setSelectedImages(files);
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

      const productData: CreateProductData = {
        name: values.name,
        slug: values.slug || undefined,
        description: values.description || undefined,
        short_description: values.short_description || undefined,
        product_type: values.product_type,
        brand_id:
          values.brand_id && values.brand_id > 0 ? values.brand_id : null,
        published_status: values.published_status || "draft",
        is_active: values.is_active ?? true,
        categories:
          values.categories && values.categories.length > 0
            ? values.categories
            : undefined,
        images: selectedImages.length > 0 ? selectedImages : undefined,
      };

      console.log("Creating product with data:", productData);
      await createProduct(token, productData);
      onSuccess();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-xl my-8">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Create Product</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

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

            <div className="grid gap-4 md:grid-cols-2">
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
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select
                  {...register("published_status")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Brand</label>
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

            <div>
              <label className="mb-1 block text-sm font-medium">
                Categories
              </label>
              <div className="max-h-32 overflow-y-auto rounded-md border p-2">
                {rootCategories.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">
                    No categories available
                  </p>
                ) : (
                  rootCategories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-1"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={(e) =>
                          handleCategoryChange(category.id, e.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm">{category.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Short Description
              </label>
              <textarea
                {...register("short_description")}
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Brief product description"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Full product description"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Product Images (Max 3)
              </label>
              <div className="mt-1 flex items-center gap-4">
                <label className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50">
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
                {selectedImages.length > 0 && (
                  <span className="text-sm text-gray-600">
                    {selectedImages.length} image(s) selected
                  </span>
                )}
              </div>
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

          <div className="mt-6 flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
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
    </div>
  );
}
