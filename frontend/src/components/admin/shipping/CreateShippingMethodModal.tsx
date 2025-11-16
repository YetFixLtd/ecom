"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import {
  createShippingMethod,
  type CreateShippingMethodData,
} from "@/lib/apis/shippingMethods";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

const schema = z.object({
  name: z.string().min(1, "Name is required."),
  code: z.string().min(1, "Code is required."),
  carrier: z.string().optional(),
  description: z.string().optional(),
  calculation_type: z.enum(["flat", "weight", "price", "weight_and_price"]),
  base_rate: z.number().min(0, "Base rate must be 0 or greater."),
  per_kg_rate: z.number().min(0).optional().or(z.literal("")),
  per_item_rate: z.number().min(0).optional().or(z.literal("")),
  free_shipping_threshold: z.number().min(0).optional().or(z.literal("")),
  max_weight_kg: z.number().min(0).optional().or(z.literal("")),
  estimated_days: z.number().min(0).optional().or(z.literal("")),
  is_active: z.boolean().optional(),
  sort_order: z.number().min(0).optional().or(z.literal("")),
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

export function CreateShippingMethodModal({ onClose, onSuccess }: Props) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      calculation_type: "flat",
      base_rate: 0,
      is_active: true,
      sort_order: 0,
    },
  });

  const calculationType = watch("calculation_type");

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setServerError("Not authenticated");
        return;
      }

      const data: CreateShippingMethodData = {
        name: values.name,
        code: values.code,
        carrier: values.carrier || undefined,
        description: values.description || undefined,
        calculation_type: values.calculation_type,
        base_rate: values.base_rate,
        per_kg_rate: typeof values.per_kg_rate === "number" ? values.per_kg_rate : undefined,
        per_item_rate: typeof values.per_item_rate === "number" ? values.per_item_rate : undefined,
        free_shipping_threshold: typeof values.free_shipping_threshold === "number" ? values.free_shipping_threshold : undefined,
        max_weight_kg: typeof values.max_weight_kg === "number" ? values.max_weight_kg : undefined,
        estimated_days: typeof values.estimated_days === "number" ? values.estimated_days : undefined,
        is_active: values.is_active,
        sort_order: typeof values.sort_order === "number" ? values.sort_order : undefined,
      };

      await createShippingMethod(token, data);
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

        setServerError(data.message || "Failed to create shipping method.");
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-4">
          <h2 className="text-lg font-semibold">Create Shipping Method</h2>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("name")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Standard Shipping"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Code <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  {...register("code")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., standard_shipping"
                />
                {errors.code && (
                  <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Carrier</label>
                <input
                  type="text"
                  {...register("carrier")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., DHL, FedEx"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Calculation Type <span className="text-red-600">*</span>
                </label>
                <select
                  {...register("calculation_type")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="flat">Flat Rate</option>
                  <option value="weight">Weight Based</option>
                  <option value="price">Price Based</option>
                  <option value="weight_and_price">Weight & Price</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <textarea
                {...register("description")}
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Optional description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Base Rate (৳) <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("base_rate", { valueAsNumber: true })}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                {errors.base_rate && (
                  <p className="mt-1 text-sm text-red-600">{errors.base_rate.message}</p>
                )}
              </div>

              {(calculationType === "weight" || calculationType === "weight_and_price") && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Per KG Rate (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("per_kg_rate", { valueAsNumber: true })}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}

              {(calculationType === "price" || calculationType === "weight_and_price") && (
                <div>
                  <label className="mb-1 block text-sm font-medium">Per Item Rate (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("per_item_rate", { valueAsNumber: true })}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Free Shipping Threshold (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("free_shipping_threshold", { valueAsNumber: true })}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Order total for free shipping"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Max Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  {...register("max_weight_kg", { valueAsNumber: true })}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Estimated Days</label>
                <input
                  type="number"
                  min="0"
                  {...register("estimated_days", { valueAsNumber: true })}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  {...register("sort_order", { valueAsNumber: true })}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("is_active")}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <label className="text-sm font-medium">Active</label>
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
              {isSubmitting ? "Creating..." : "Create Shipping Method"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

