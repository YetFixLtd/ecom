"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  updateCategory,
  type Category,
  type UpdateCategoryData,
} from "@/lib/apis/categories";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z.object({
  name: z.string().min(1, "Name is required.").optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  parent_id: z.number().nullable().optional(),
  position: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  meta_title: z.string().optional().or(z.literal("")),
  meta_description: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

interface Props {
  category: Category;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}

export function EditCategoryModal({
  category,
  categories,
  onClose,
  onSuccess,
}: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out self and descendants to prevent circular references
  const availableParents = categories.filter(
    (cat) => cat.id !== category.id && cat.parent_id !== category.id
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent_id: category.parent_id,
      position: category.position,
      is_active: category.is_active,
      meta_title: category.meta_title || "",
      meta_description: category.meta_description || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setServerError("Not authenticated");
        return;
      }

      const updateData: UpdateCategoryData = {};
      if (values.name && values.name !== category.name) updateData.name = values.name;
      if (values.slug !== undefined && values.slug !== category.slug)
        updateData.slug = values.slug || undefined;
      if (values.description !== category.description)
        updateData.description = values.description || undefined;
      if (values.parent_id !== category.parent_id)
        updateData.parent_id = values.parent_id ?? null;
      if (values.position !== undefined && values.position !== category.position)
        updateData.position = values.position;
      if (values.is_active !== undefined && values.is_active !== category.is_active)
        updateData.is_active = values.is_active;
      if (values.meta_title !== category.meta_title)
        updateData.meta_title = values.meta_title || undefined;
      if (values.meta_description !== category.meta_description)
        updateData.meta_description = values.meta_description || undefined;

      if (Object.keys(updateData).length === 0) {
        setServerError("No changes to save");
        setIsSubmitting(false);
        return;
      }

      await updateCategory(token, category.id, updateData);
      onSuccess();
    } catch (error) {
      if (error instanceof AxiosError && error.response) {
        const data = error.response.data as ValidationError;

        if (data.errors) {
          Object.keys(data.errors).forEach((field) => {
            const fieldErrors = data.errors?.[field];
            if (fieldErrors && fieldErrors.length > 0) {
              setError(field as keyof FormValues, {
                type: "server",
                message: fieldErrors[0],
              });
            }
          });
        }

        setServerError(data.message || "Failed to update category.");
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Edit Category</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
          <div className="space-y-4">
            {serverError && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">Name</label>
              <input
                type="text"
                {...register("name")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Parent Category</label>
              <select
                {...register("parent_id", { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">None (Root Category)</option>
                {availableParents.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                {...register("description")}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("is_active")}
                id="is_active_edit"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="is_active_edit" className="text-sm font-medium">
                Active
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

