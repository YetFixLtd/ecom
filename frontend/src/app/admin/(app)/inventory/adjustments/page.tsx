"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TrendingUp } from "lucide-react";
import {
  createAdjustment,
  getWarehouses,
  type CreateAdjustmentData,
  type Warehouse,
  type AdjustmentMode,
} from "@/lib/apis/inventory";
import { getProducts, type Product } from "@/lib/apis/products";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import { SearchableVariantSelect } from "@/components/admin/inventory/SearchableVariantSelect";

const schema = z.object({
  variant_id: z.number().min(1, "Variant ID is required."),
  warehouse_id: z.number().min(1, "Warehouse is required."),
  adjustment_mode: z.enum(["SET_ON_HAND", "DELTA_ON_HAND"]),
  qty: z.number(),
  unit_cost: z.number().min(0).optional().nullable(),
  reason_code: z.string().max(64).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function AdjustmentsPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      adjustment_mode: "SET_ON_HAND",
    },
  });

  const adjustmentMode = watch("adjustment_mode");

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingDropdowns(true);
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;

        // Fetch warehouses
        const warehousesRes = await getWarehouses({ size: 100 });
        setWarehouses(warehousesRes.data);

        // Fetch all products first
        const productsRes = await getProducts(token, { size: 1000 });
        
        // Filter to only variant-type products and fetch their details with variants
        const variantProducts = productsRes.data.filter(
          (p) => p.product_type === "variant"
        );
        
        // Fetch details for variant products to get their variants
        const { getProduct } = await import("@/lib/apis/products");
        const productsWithVariantsData = await Promise.all(
          variantProducts.map(async (product) => {
            try {
              const detail = await getProduct(token, product.id, {
                with_variants: true,
              });
              return detail.data;
            } catch (err) {
              console.error(`Failed to fetch variants for product ${product.id}:`, err);
              return product; // Return product without variants if fetch fails
            }
          })
        );

        setProducts(productsWithVariantsData);
      } catch (error) {
        console.error("Failed to fetch dropdown data:", error);
      } finally {
        setLoadingDropdowns(false);
      }
    };
    fetchDropdownData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const data: CreateAdjustmentData = {
        variant_id: values.variant_id,
        warehouse_id: values.warehouse_id,
        adjustment_mode: values.adjustment_mode as AdjustmentMode,
        qty: values.qty,
        unit_cost: values.unit_cost || null,
        reason_code: values.reason_code || null,
        note: values.note || null,
      };

      await createAdjustment(data);
      alert("Adjustment created successfully!");
      router.push("/admin/inventory/items");
    } catch (error) {
      console.error("Error creating adjustment:", error);
      if (error instanceof AxiosError) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.errors ||
          "Failed to create adjustment. Please try again.";
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
      <div>
        <h1 className="text-2xl font-semibold">Stock Adjustments</h1>
        <p className="text-sm text-gray-600">
          Adjust inventory levels for products
        </p>
      </div>

      {serverError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-lg border bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-medium">Adjustment Details</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Product Variant <span className="text-red-500">*</span>
              </label>
              <SearchableVariantSelect
                products={products}
                value={watch("variant_id")}
                onChange={(variantId) => setValue("variant_id", variantId)}
                disabled={loadingDropdowns}
                error={errors.variant_id?.message}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                {...register("warehouse_id", { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={0}>Select warehouse</option>
                {warehouses.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name} ({warehouse.code})
                  </option>
                ))}
              </select>
              {errors.warehouse_id && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.warehouse_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">
              Adjustment Mode <span className="text-red-500">*</span>
            </label>
            <select
              {...register("adjustment_mode")}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="SET_ON_HAND">Set On Hand (Absolute)</option>
              <option value="DELTA_ON_HAND">Delta On Hand (Relative)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {adjustmentMode === "SET_ON_HAND"
                ? "Set the inventory to the exact quantity specified."
                : "Add or subtract the quantity from current inventory."}
            </p>
            {errors.adjustment_mode && (
              <p className="mt-1 text-xs text-red-600">
                {errors.adjustment_mode.message}
              </p>
            )}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register("qty", { valueAsNumber: true })}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder={adjustmentMode === "SET_ON_HAND" ? "Target quantity" : "Change amount"}
            />
            {errors.qty && (
              <p className="mt-1 text-xs text-red-600">
                {errors.qty.message}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">Additional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Unit Cost
              </label>
              <input
                type="number"
                step="0.01"
                {...register("unit_cost", { valueAsNumber: true })}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Reason Code
              </label>
              <input
                type="text"
                {...register("reason_code")}
                maxLength={64}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., COUNT_CORRECTION, FOUND_STOCK"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Note</label>
              <textarea
                {...register("note")}
                maxLength={500}
                rows={3}
                className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Optional note about this adjustment"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Adjustment"}
          </button>
        </div>
      </form>
    </div>
  );
}

