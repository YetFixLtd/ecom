"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Package } from "lucide-react";
import Link from "next/link";
import {
  getFulfillment,
  updateFulfillment,
  updateFulfillmentStatus,
  type Fulfillment,
  type FulfillmentStatus,
} from "@/lib/apis/admin/orders";
import { AxiosError } from "axios";

const fulfillmentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  packed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
};

export default function FulfillmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fulfillmentId = parseInt(params.id as string);

  const [fulfillment, setFulfillment] = useState<Fulfillment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  useEffect(() => {
    const fetchFulfillment = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getFulfillment(fulfillmentId);
        setFulfillment(response.data);
        setTrackingNumber(response.data.tracking_number || "");
        setCarrier(response.data.carrier || "");
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to fetch fulfillment");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (fulfillmentId) {
      fetchFulfillment();
    }
  }, [fulfillmentId]);

  const handleStatusUpdate = async (newStatus: FulfillmentStatus) => {
    if (!fulfillment) return;

    setUpdating(true);
    try {
      const response = await updateFulfillmentStatus(fulfillmentId, {
        status: newStatus,
      });
      setFulfillment(response.data);
      if (newStatus === "returned") {
        alert("Inventory has been restored for returned items.");
      }
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to update fulfillment status");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillment) return;

    setUpdating(true);
    try {
      const response = await updateFulfillment(fulfillmentId, {
        tracking_number: trackingNumber || undefined,
        carrier: carrier || undefined,
      });
      setFulfillment(response.data);
      alert("Fulfillment details updated successfully");
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to update fulfillment");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading fulfillment...</div>
      </div>
    );
  }

  if (error || !fulfillment) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Fulfillment not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={fulfillment.order ? `/admin/orders/${fulfillment.order_id}` : "/admin/orders"}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Fulfillment #{fulfillment.id}</h1>
            <p className="text-sm text-gray-600">
              {fulfillment.order && `Order ${fulfillment.order.order_number}`}
            </p>
          </div>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
            fulfillmentStatusColors[fulfillment.status] ||
            "bg-gray-100 text-gray-800"
          }`}
        >
          {fulfillment.status.charAt(0).toUpperCase() +
            fulfillment.status.slice(1)}
        </span>
      </div>

      {/* Status Update */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Update Fulfillment Status</h2>
        <div className="flex flex-wrap gap-2">
          {([
            "pending",
            "packed",
            "shipped",
            "delivered",
            "canceled",
            "returned",
          ] as FulfillmentStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleStatusUpdate(status)}
              disabled={updating || fulfillment.status === status}
              className={`rounded-md px-3 py-1 text-sm font-medium ${
                fulfillment.status === status
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } disabled:opacity-50`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        {fulfillment.status === "returned" && (
          <p className="mt-2 text-sm text-green-600">
            Inventory has been restored for returned items.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Fulfillment Items */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-4 text-lg font-semibold">Fulfillment Items</h2>
            {fulfillment.items && fulfillment.items.length > 0 ? (
              <div className="space-y-3">
                {fulfillment.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {item.order_item?.product_name || "Unknown Product"}
                      </div>
                      <div className="text-sm text-gray-600">
                        SKU: {item.order_item?.variant_sku || "N/A"} | Qty:{" "}
                        {item.qty}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No items</div>
            )}
          </div>

          {/* Tracking Information Update */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-4 text-lg font-semibold">Tracking Information</h2>
            <form onSubmit={handleUpdateDetails} className="space-y-3">
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
              <button
                type="submit"
                disabled={updating}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Details"}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Info */}
          {fulfillment.order && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Order Information</h2>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Order Number:</span>{" "}
                  <Link
                    href={`/admin/orders/${fulfillment.order_id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {fulfillment.order.order_number}
                  </Link>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>{" "}
                  <span className="font-medium">{fulfillment.order.status}</span>
                </div>
                {fulfillment.order.user && (
                  <div>
                    <span className="text-gray-600">Customer:</span>{" "}
                    <span className="font-medium">
                      {fulfillment.order.user.full_name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {fulfillment.order?.shipping_address && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Shipping Address</h2>
              <div className="text-sm text-gray-600">
                <div>{fulfillment.order.shipping_address.name}</div>
                <div>{fulfillment.order.shipping_address.line1}</div>
                {fulfillment.order.shipping_address.line2 && (
                  <div>{fulfillment.order.shipping_address.line2}</div>
                )}
                <div>
                  {fulfillment.order.shipping_address.city}
                  {fulfillment.order.shipping_address.state_region &&
                    `, ${fulfillment.order.shipping_address.state_region}`}
                </div>
                <div>
                  {fulfillment.order.shipping_address.postal_code}{" "}
                  {fulfillment.order.shipping_address.country_code}
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Timestamps</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Created:</span>{" "}
                {formatDate(fulfillment.created_at)}
              </div>
              {fulfillment.shipped_at && (
                <div>
                  <span className="text-gray-600">Shipped:</span>{" "}
                  {formatDate(fulfillment.shipped_at)}
                </div>
              )}
              {fulfillment.delivered_at && (
                <div>
                  <span className="text-gray-600">Delivered:</span>{" "}
                  {formatDate(fulfillment.delivered_at)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

