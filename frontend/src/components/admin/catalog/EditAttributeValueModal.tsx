"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  updateAttributeValue,
  type AttributeValue,
  type UpdateAttributeValueData,
} from "@/lib/apis/attributes";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z.object({
  value: z.string().min(1, "Value is required.").optional().or(z.literal("")),
  value_key: z.string().optional().nullable(),
  position: z.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface ValidationError {
  message: string;
  errors?: {
    [key: string]: string[];
  };
}

interface Props {
  attributeId: number;
  attributeValue: AttributeValue;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditAttributeValueModal({
  attributeId,
  attributeValue,
  onClose,
  onSuccess,
}: Props) {
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
      value: attributeValue.value,
      value_key: attributeValue.value_key || null,
      position: attributeValue.position,
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

      const updateData: UpdateAttributeValueData = {};
      if (values.value && values.value !== attributeValue.value)
        updateData.value = values.value;
      if (
        values.value_key !== undefined &&
        values.value_key !== attributeValue.value_key
      )
        updateData.value_key = values.value_key || null;
      if (
        values.position !== undefined &&
        values.position !== attributeValue.position
      )
        updateData.position = values.position;

      if (Object.keys(updateData).length === 0) {
        setServerError("No changes to save");
        setIsSubmitting(false);
        return;
      }

      await updateAttributeValue(
        token,
        attributeId,
        attributeValue.id,
        updateData
      );
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

        setServerError(data.message || "Failed to update attribute value.");
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
          <h2 className="text-lg font-semibold">Edit Attribute Value</h2>
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
              <label className="mb-1 block text-sm font-medium">Value</label>
              <input
                type="text"
                {...register("value")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.value && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.value.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Value Key
              </label>
              <input
                type="text"
                {...register("value_key")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.value_key && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.value_key.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Position</label>
              <input
                type="number"
                {...register("position", { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.position && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.position.message}
                </p>
              )}
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
