"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import { getOrder } from "@/lib/apis/client/orders";
import { getUserTokenFromCookies } from "@/lib/cookies";
import type { Order } from "@/types/client";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    const token = await getUserTokenFromCookies();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await getOrder(token, orderId);
      setOrder(response.data);
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-zinc-100 text-zinc-800";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading order...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Order not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/orders"
            className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
          >
            ← Back to Orders
          </Link>

          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900">
                  Order #{order.order_number}
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Order ID: {order.id} | Placed on:{" "}
                  {order.placed_at
                    ? new Date(order.placed_at).toLocaleString()
                    : new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(
                  order.status
                )}`}
              >
                {order.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">
                  Order Items
                </h2>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between pb-4 border-b border-zinc-200 last:border-0 last:pb-0"
                    >
                      <div>
                        <h3 className="font-semibold text-zinc-900">
                          {item.product_name}
                        </h3>
                        <p className="text-sm text-zinc-500">
                          Item ID: {item.id} | SKU: {item.variant_sku}
                        </p>
                        <p className="text-sm text-zinc-500">
                          Quantity: {item.quantity} | Variant ID:{" "}
                          {item.variant_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-zinc-900">
                          ৳{item.total.toFixed(2)}
                        </p>
                        <p className="text-sm text-zinc-500">
                          ৳{item.unit_price.toFixed(2)} each
                        </p>
                        {item.discount_total > 0 && (
                          <p className="text-xs text-red-600">
                            Discount: -৳{item.discount_total.toFixed(2)}
                          </p>
                        )}
                        {item.tax_total > 0 && (
                          <p className="text-xs text-zinc-500">
                            Tax: ৳{item.tax_total.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {order.billing_address && (
                <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-6">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">
                    Billing Address
                  </h2>
                  <div className="space-y-2">
                    {order.billing_address.contact_name && (
                      <p className="text-zinc-700">
                        <span className="font-medium">Contact:</span>{" "}
                        {order.billing_address.contact_name}
                      </p>
                    )}
                    {order.billing_address.phone && (
                      <p className="text-zinc-700">
                        <span className="font-medium">Phone:</span>{" "}
                        {order.billing_address.phone}
                      </p>
                    )}
                    <p className="text-zinc-700">
                      {order.billing_address.full_address}
                    </p>
                  </div>
                </div>
              )}

              {order.shipping_address && (
                <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                  <h2 className="text-xl font-bold text-zinc-900 mb-4">
                    Shipping Address
                  </h2>
                  <div className="space-y-2">
                    {order.shipping_address.contact_name && (
                      <p className="text-zinc-700">
                        <span className="font-medium">Contact:</span>{" "}
                        {order.shipping_address.contact_name}
                      </p>
                    )}
                    {order.shipping_address.phone && (
                      <p className="text-zinc-700">
                        <span className="font-medium">Phone:</span>{" "}
                        {order.shipping_address.phone}
                      </p>
                    )}
                    <p className="text-zinc-700">
                      {order.shipping_address.full_address}
                    </p>
                  </div>
                  {order.shipping_method && (
                    <div className="mt-4 pt-4 border-t border-zinc-200">
                      <p className="text-sm text-zinc-500">Shipping Method</p>
                      <p className="text-zinc-700 font-medium">
                        {order.shipping_method.name}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-zinc-700">
                    <span>Subtotal</span>
                    <span>৳{order.subtotal.toFixed(2)}</span>
                  </div>
                  {order.discount_total > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span>Discount</span>
                      <span>-৳{order.discount_total.toFixed(2)}</span>
                    </div>
                  )}
                  {order.shipping_total > 0 && (
                    <div className="flex justify-between text-zinc-700">
                      <span>Shipping</span>
                      <span>৳{order.shipping_total.toFixed(2)}</span>
                    </div>
                  )}
                  {order.tax_total > 0 && (
                    <div className="flex justify-between text-zinc-700">
                      <span>Tax</span>
                      <span>৳{order.tax_total.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-zinc-200 pt-4">
                  <div className="flex justify-between text-lg font-bold text-zinc-900">
                    <span>Total</span>
                    <span>৳{order.grand_total.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-1">
                    {order.currency === "USD" ? "BDT" : order.currency}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
