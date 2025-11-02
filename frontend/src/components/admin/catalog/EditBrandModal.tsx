"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { updateBrand, type Brand, type UpdateBrandData } from "@/lib/apis/brands";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z.object({
  name: z.string().min(1, "Name is required.").optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")),
  website_url: z.string().url("Please provide a valid URL.").optional().or(z.literal("")),
  logo_url: z.string().url("Please provide a valid URL.").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

interface Props {
  brand: Brand;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditBrandModal({ brand, onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: brand.name,
      slug: brand.slug,
      website_url: brand.website_url || "",
      logo_url: brand.logo_url || "",
      description: brand.description || "",
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

      const updateData: UpdateBrandData = {};
      if (values.name && values.name !== brand.name) updateData.name = values.name;
      if (values.slug !== undefined && values.slug !== brand.slug) updateData.slug = values.slug || undefined;
      if (values.website_url !== brand.website_url) updateData.website_url = values.website_url || undefined;
      if (values.logo_url !== brand.logo_url) updateData.logo_url = values.logo_url || undefined;
      if (values.description !== brand.description) updateData.description = values.description || undefined;

      if (Object.keys(updateData).length === 0) {
        setServerError("No changes to save");
        setIsSubmitting(false);
        return;
      }

      await updateBrand(token, brand.id, updateData);
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

        setServerError(data.message || "Failed to update brand.");
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
          <h2 className="text-lg font-semibold">Edit Brand</h2>
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
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <input
                type="text"
                {...register("slug")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Website URL</label>
              <input
                type="url"
                {...register("website_url")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.website_url && (
                <p className="mt-1 text-sm text-red-600">{errors.website_url.message}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Logo URL</label>
              <input
                type="url"
                {...register("logo_url")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.logo_url && (
                <p className="mt-1 text-sm text-red-600">{errors.logo_url.message}</p>
              )}
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

