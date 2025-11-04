"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createWarehouse, type CreateWarehouseData } from "@/lib/apis/inventory";
import { AxiosError } from "axios";

const schema = z.object({
  name: z.string().min(1, "Warehouse name is required."),
  code: z.string().min(1, "Warehouse code is required."),
  address1: z.string().optional(),
  address2: z.string().optional(),
  city: z.string().optional(),
  state_region: z.string().optional(),
  postal_code: z.string().optional(),
  country_code: z.string().length(2, "Country code must be 2 characters.").optional().or(z.literal("")),
  is_default: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateWarehousePage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_default: false,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const data: CreateWarehouseData = {
        name: values.name,
        code: values.code,
        address1: values.address1 || null,
        address2: values.address2 || null,
        city: values.city || null,
        state_region: values.state_region || null,
        postal_code: values.postal_code || null,
        country_code: values.country_code || null,
        is_default: values.is_default || false,
      };

      await createWarehouse(data);
      router.push("/admin/inventory/warehouses");
    } catch (error) {
      console.error("Error creating warehouse:", error);
      if (error instanceof AxiosError) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors ||
          "Failed to create warehouse. Please try again.";
        setServerError(
          typeof errorMessage === "string"
            ? errorMessage
            : JSON.stringify(errorMessage)
        );
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/inventory/warehouses"
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create Warehouse</h1>
          <p className="text-sm text-gray-600">Add a new warehouse location</p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">Basic Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("code")}
                className="w-full rounded-md border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., MAIN-001"
              />
              {errors.code && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.code.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">Address</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Address Line 1
              </label>
              <input
                type="text"
                {...register("address1")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Address Line 2
              </label>
              <input
                type="text"
                {...register("address2")}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">City</label>
                <input
                  type="text"
                  {...register("city")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  State/Region
                </label>
                <input
                  type="text"
                  {...register("state_region")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Postal Code
                </label>
                <input
                  type="text"
                  {...register("postal_code")}
                  className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Country Code
              </label>
              <input
                type="text"
                {...register("country_code")}
                maxLength={2}
                className="w-full rounded-md border px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., BD, US"
              />
              {errors.country_code && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.country_code.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              {...register("is_default")}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
            />
            <label htmlFor="is_default" className="text-sm font-medium">
              Set as default warehouse
            </label>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            If checked, this warehouse will be set as the default. Any existing
            default will be unset.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/admin/inventory/warehouses"
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Warehouse"}
          </button>
        </div>
      </form>
    </div>
  );
}

