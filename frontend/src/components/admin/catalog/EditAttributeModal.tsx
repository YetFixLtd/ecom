"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  updateAttribute,
  type Attribute,
  type UpdateAttributeData,
} from "@/lib/apis/attributes";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z.object({
  name: z.string().min(1, "Name is required.").optional().or(z.literal("")),
  slug: z.string().optional().or(z.literal("")),
  type: z.string().optional(),
  position: z.number().min(0).optional(),
  is_filterable: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

interface Props {
  attribute: Attribute;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAttributeModal({ attribute, onClose, onSuccess }: Props) {
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
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      position: attribute.position,
      is_filterable: attribute.is_filterable,
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

      const updateData: UpdateAttributeData = {};
      if (values.name && values.name !== attribute.name) updateData.name = values.name;
      if (values.slug !== undefined && values.slug !== attribute.slug)
        updateData.slug = values.slug || undefined;
      if (values.is_filterable !== undefined && values.is_filterable !== attribute.is_filterable)
        updateData.is_filterable = values.is_filterable;

      if (Object.keys(updateData).length === 0) {
        setServerError("No changes to save");
        setIsSubmitting(false);
        return;
      }

      await updateAttribute(token, attribute.id, updateData);
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

        setServerError(data.message || "Failed to update attribute.");
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
          <h2 className="text-lg font-semibold">Edit Attribute</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100">
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
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Slug</label>
              <input
                type="text"
                {...register("slug")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("is_filterable")}
                id="is_filterable_edit"
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="is_filterable_edit" className="text-sm font-medium">
                Use for filtering
              </label>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

