"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import {
  getOrder,
  createFulfillment,
  type Order,
  type CreateFulfillmentData,
} from "@/lib/apis/admin/orders";
import { getWarehouses, type Warehouse } from "@/lib/apis/inventory";
import { AxiosError } from "axios";

export default function CreateFulfillmentPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const [order, setOrder] = useState<Order | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<
    Record<number, number>
  >({});
  const [warehouseId, setWarehouseId] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [orderResponse, warehousesResponse] = await Promise.all([
          getOrder(orderId),
          getWarehouses({}),
        ]);

        setOrder(orderResponse.data);
        setWarehouses(warehousesResponse.data);

        // Set default warehouse if available
        const defaultWarehouse = warehousesResponse.data.find(
          (w) => w.is_default
        );
        if (defaultWarehouse) {
          setWarehouseId(defaultWarehouse.id);
        }
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load data");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchData();
    }
  }, [orderId]);

  const handleItemQuantityChange = (itemId: number, qty: number) => {
    if (qty <= 0) {
      const newSelected = { ...selectedItems };
      delete newSelected[itemId];
      setSelectedItems(newSelected);
    } else {
      setSelectedItems({ ...selectedItems, [itemId]: qty });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Object.keys(selectedItems).length === 0) {
      alert("Please select at least one item to fulfill");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const fulfillmentData: CreateFulfillmentData = {
        items: Object.entries(selectedItems).map(([orderItemId, qty]) => ({
          order_item_id: parseInt(orderItemId),
          qty,
        })),
        warehouse_id: warehouseId || undefined,
        tracking_number: trackingNumber || undefined,
        carrier: carrier || undefined,
      };

      await createFulfillment(orderId, fulfillmentData);
      router.push(`/admin/orders/${orderId}`);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.errors
              ? JSON.stringify(err.response.data.errors)
              : "Failed to create fulfillment"
        );
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!order) {
    return <div>Order not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/orders/${orderId}`}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create Fulfillment</h1>
          <p className="text-sm text-gray-600">
            Order {order.order_number}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Items Selection */}
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold">Select Items to Fulfill</h2>
          <div className="space-y-4">
            {order.items?.map((item) => {
              const remainingQty = item.remaining_qty ?? item.qty;
              const selectedQty = selectedItems[item.id] || 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-gray-600">
                      SKU: {item.variant_sku} | Ordered: {item.qty} | Remaining:{" "}
                      {remainingQty}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={remainingQty}
                      value={selectedQty}
                      onChange={(e) =>
                        handleItemQuantityChange(
                          item.id,
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 rounded-md border px-2 py-1 text-sm"
                    />
                    <span className="text-sm text-gray-600">of {remainingQty}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warehouse Selection */}
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Warehouse</h2>
          <select
            value={warehouseId || ""}
            onChange={(e) =>
              setWarehouseId(e.target.value ? parseInt(e.target.value) : null)
            }
            className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Use Default Warehouse</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name} {warehouse.is_default && "(Default)"}
              </option>
            ))}
          </select>
        </div>

        {/* Tracking Information */}
        <div className="rounded-lg border bg-white p-4">
          <h2 className="mb-3 text-lg font-semibold">Tracking Information (Optional)</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tracking Number
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Carrier
              </label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="e.g., DHL, FedEx, Local Courier"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/orders/${orderId}`}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || Object.keys(selectedItems).length === 0}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Fulfillment"}
          </button>
        </div>
      </form>
    </div>
  );
}

