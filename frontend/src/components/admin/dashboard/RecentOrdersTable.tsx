"use client";

import Link from "next/link";
import type { RecentOrder } from "@/types/dashboard";

interface RecentOrdersTableProps {
  orders: RecentOrder[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  fulfilled: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
  partial: "bg-indigo-100 text-indigo-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  canceled: "Canceled",
  refunded: "Refunded",
  partial: "Partial",
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
  const formatCurrency = (amount: number, currency: string) => {
    // Format with Bangladeshi Taka symbol
    const formatted = new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `৳${formatted}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        </div>
        <p className="text-sm text-gray-600">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <p className="text-sm text-gray-600">Latest order activity</p>
        </div>
        <Link
          href="/admin/orders"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View All →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Order #
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order.id}
                className="transition-colors hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {order.order_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {order.user?.full_name || order.user?.email || "Guest"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      STATUS_COLORS[order.status] ||
                      "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {formatCurrency(order.grand_total, order.currency)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {formatDate(order.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

