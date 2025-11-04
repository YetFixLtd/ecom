"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import {
  getTransfer,
  updateTransfer,
  getWarehouses,
  type UpdateTransferData,
  type Transfer,
  type Warehouse,
} from "@/lib/apis/inventory";
import { AxiosError } from "axios";

const schema = z.object({
  from_warehouse_id: z.number().min(1, "Source warehouse is required.").optional(),
  to_warehouse_id: z.number().min(1, "Destination warehouse is required.").optional(),
  items: z
    .array(
      z.object({
        variant_id: z.number().min(1, "Variant is required."),
        qty: z.number().min(1, "Quantity must be at least 1."),
      })
    )
    .min(1, "At least one item is required.")
    .optional(),
});

type FormValues = z.infer<typeof schema>;

export default function EditTransferPage() {
  const router = useRouter();
  const params = useParams();
  const transferId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const fromWarehouseId = watch("from_warehouse_id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transferRes, warehousesRes] = await Promise.all([
          getTransfer(transferId),
          getWarehouses({ size: 100 }),
        ]);

        const transferData = transferRes.data;
        setTransfer(transferData);
        setWarehouses(warehousesRes.data);

        if (!transferData.is_draft) {
          setServerError("Only draft transfers can be edited.");
          return;
        }

        reset({
          from_warehouse_id: transferData.from_warehouse_id,
          to_warehouse_id: transferData.to_warehouse_id,
          items:
            transferData.items?.map((item) => ({
              variant_id: item.variant_id,
              qty: item.qty,
            })) || [],
        });
      } catch (err) {
        if (err instanceof AxiosError) {
          setServerError(err.response?.data?.message || "Failed to load transfer");
        } else {
          setServerError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (transferId) {
      fetchData();
    }
  }, [transferId, reset]);

  const onSubmit = async (values: FormValues) => {
    if (
      values.from_warehouse_id &&
      values.to_warehouse_id &&
      values.from_warehouse_id === values.to_warehouse_id
    ) {
      setServerError("Source and destination warehouses must be different.");
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    try {
      const data: UpdateTransferData = {};
      if (values.from_warehouse_id) data.from_warehouse_id = values.from_warehouse_id;
      if (values.to_warehouse_id) data.to_warehouse_id = values.to_warehouse_id;
      if (values.items) data.items = values.items;

      await updateTransfer(transferId, data);
      router.push(`/admin/inventory/transfers/${transferId}`);
    } catch (error) {
      console.error("Error updating transfer:", error);
      if (error instanceof AxiosError) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors ||
          "Failed to update transfer. Please try again.";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading transfer...</div>
      </div>
    );
  }

  if (serverError && !transfer) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
        <Link
          href="/admin/inventory/transfers"
          className="text-blue-600 hover:underline"
        >
          ← Back to Transfers
        </Link>
      </div>
    );
  }

  if (transfer && !transfer.is_draft) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          Only draft transfers can be edited.
        </div>
        <Link
          href={`/admin/inventory/transfers/${transferId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Transfer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/inventory/transfers/${transferId}`}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Edit Transfer #{transferId}</h1>
          <p className="text-sm text-gray-600">Update transfer details</p>
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">Warehouses</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                From Warehouse
              </label>
              <select
                {...register("from_warehouse_id", { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={0}>Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
              {errors.from_warehouse_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.from_warehouse_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                To Warehouse
              </label>
              <select
                {...register("to_warehouse_id", { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={0}>Select warehouse</option>
                {warehouses
                  .filter((w) => w.id !== fromWarehouseId)
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} ({warehouse.code})
                    </option>
                  ))}
              </select>
              {errors.to_warehouse_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.to_warehouse_id.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Items</h2>
            <button
              type="button"
              onClick={() => append({ variant_id: 0, qty: 1 })}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 rounded-md border p-4">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">
                    Variant ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register(`items.${index}.variant_id`, {
                      valueAsNumber: true,
                    })}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="Variant ID"
                  />
                  {errors.items?.[index]?.variant_id && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items[index]?.variant_id?.message}
                    </p>
                  )}
                </div>

                <div className="w-32">
                  <label className="mb-1 block text-sm font-medium">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register(`items.${index}.qty`, { valueAsNumber: true })}
                    min={1}
                    className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {errors.items?.[index]?.qty && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.items[index]?.qty?.message}
                    </p>
                  )}
                </div>

                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="mt-6 rounded-md p-2 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {errors.items && typeof errors.items === "object" && "message" in errors.items && (
            <p className="mt-2 text-xs text-red-600">{errors.items.message}</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href={`/admin/inventory/transfers/${transferId}`}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Updating..." : "Update Transfer"}
          </button>
        </div>
      </form>
    </div>
  );
}

