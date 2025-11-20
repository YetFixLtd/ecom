"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getOrder,
  updateOrderStatus,
  type Order,
  type OrderStatus,
} from "@/lib/apis/admin/orders";
import { AxiosError } from "axios";
import Link from "next/link";
import { Package, ArrowLeft, Plus } from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const fulfillmentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  packed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  returned: "bg-orange-100 text-orange-800",
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = parseInt(params.id as string);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getOrder(orderId);
      setOrder(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch order");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order) return;

    setUpdatingStatus(true);
    try {
      const response = await updateOrderStatus(orderId, { status: newStatus });
      setOrder(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to update order status");
      } else {
        alert("An unexpected error occurred");
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
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
        <div className="text-sm text-gray-500">Loading order...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Order not found"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/orders"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Order {order.order_number}</h1>
            <p className="text-sm text-gray-600">
              Placed on {formatDate(order.placed_at || order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
              statusColors[order.status] || "bg-gray-100 text-gray-800"
            }`}
          >
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Order Status Update */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Update Order Status</h2>
        <div className="flex gap-2">
          {(["pending", "paid", "fulfilled", "canceled", "refunded"] as OrderStatus[]).map(
            (status) => (
              <button
                key={status}
                onClick={() => handleStatusUpdate(status)}
                disabled={updatingStatus || order.status === status}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  order.status === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                } disabled:opacity-50`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-4 text-lg font-semibold">Order Items</h2>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div className="flex-1">
                    <div className="font-medium">{item.product_name}</div>
                    <div className="text-sm text-gray-600">
                      SKU: {item.variant_sku} | Qty: {item.qty}
                      {item.fulfilled_qty !== undefined && (
                        <span className="ml-2">
                          (Fulfilled: {item.fulfilled_qty}, Remaining:{" "}
                          {item.remaining_qty})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(item.total, order.currency)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatCurrency(item.unit_price, order.currency)} each
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fulfillments */}
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Fulfillments</h2>
              <Link
                href={`/admin/orders/${order.id}/fulfillments/create`}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create Fulfillment
              </Link>
            </div>
            {order.fulfillments && order.fulfillments.length > 0 ? (
              <div className="space-y-3">
                {order.fulfillments.map((fulfillment) => (
                  <Link
                    key={fulfillment.id}
                    href={`/admin/fulfillments/${fulfillment.id}`}
                    className="block rounded-md border p-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium">
                            Fulfillment #{fulfillment.id}
                          </div>
                          <div className="text-sm text-gray-600">
                            {fulfillment.tracking_number
                              ? `Tracking: ${fulfillment.tracking_number}`
                              : "No tracking number"}
                            {fulfillment.carrier && ` | ${fulfillment.carrier}`}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          fulfillmentStatusColors[fulfillment.status] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {fulfillment.status.charAt(0).toUpperCase() +
                          fulfillment.status.slice(1)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No fulfillments yet</div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Customer</h2>
            {order.user ? (
              <div className="space-y-1 text-sm">
                <div className="font-medium">{order.user.full_name}</div>
                <div className="text-gray-600">{order.user.email}</div>
                {order.user.phone && (
                  <div className="text-gray-600">Phone: {order.user.phone}</div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Guest order (see shipping details for contact info)
              </div>
            )}
          </div>

          {/* Billing Address */}
          {order.billing_address && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Billing Address</h2>
              <div className="space-y-1 text-sm text-gray-700">
                {order.billing_address.contact_name && (
                  <div className="font-medium">
                    {order.billing_address.contact_name}
                  </div>
                )}
                {order.billing_address.phone && (
                  <div className="text-gray-600">
                    Phone: {order.billing_address.phone}
                  </div>
                )}
                <div>{order.billing_address.line1}</div>
                {order.billing_address.line2 && (
                  <div>{order.billing_address.line2}</div>
                )}
                <div>
                  {[order.billing_address.city, order.billing_address.state_region, order.billing_address.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                <div>{order.billing_address.country_code}</div>
              </div>
            </div>
          )}

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Shipping Address</h2>
              <div className="space-y-1 text-sm text-gray-700">
                {order.shipping_address.contact_name && (
                  <div className="font-medium">
                    {order.shipping_address.contact_name}
                  </div>
                )}
                {order.shipping_address.phone && (
                  <div className="text-gray-600">
                    Phone: {order.shipping_address.phone}
                  </div>
                )}
                <div>{order.shipping_address.line1}</div>
                {order.shipping_address.line2 && (
                  <div>{order.shipping_address.line2}</div>
                )}
                <div>
                  {[order.shipping_address.city, order.shipping_address.state_region, order.shipping_address.postal_code]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                <div>{order.shipping_address.country_code}</div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-lg border bg-white p-4">
            <h2 className="mb-3 text-lg font-semibold">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatCurrency(order.subtotal, order.currency)}</span>
              </div>
              {order.discount_total > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Discount</span>
                  <span className="text-red-600">
                    -{formatCurrency(order.discount_total, order.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span>{formatCurrency(order.shipping_total, order.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax</span>
                <span>{formatCurrency(order.tax_total, order.currency)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(order.grand_total, order.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payments */}
          {order.payments && order.payments.length > 0 && (
            <div className="rounded-lg border bg-white p-4">
              <h2 className="mb-3 text-lg font-semibold">Payments</h2>
              <div className="space-y-2 text-sm">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between">
                    <span className="text-gray-600">
                      {payment.provider} ({payment.status})
                    </span>
                    <span>{formatCurrency(payment.amount, payment.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

