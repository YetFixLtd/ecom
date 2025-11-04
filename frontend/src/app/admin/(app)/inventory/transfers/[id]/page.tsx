"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Truck, Package, X } from "lucide-react";
import Link from "next/link";
import {
  getTransfer,
  dispatchTransfer,
  receiveTransfer,
  cancelTransfer,
  type Transfer,
} from "@/lib/apis/inventory";
import { AxiosError } from "axios";

export default function TransferDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transferId = Number(params.id);

  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransfer = async () => {
      try {
        const response = await getTransfer(transferId);
        setTransfer(response.data);
      } catch (err) {
        if (err instanceof AxiosError) {
          setError(err.response?.data?.message || "Failed to load transfer");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (transferId) {
      fetchTransfer();
    }
  }, [transferId]);

  const handleAction = async (action: "dispatch" | "receive" | "cancel") => {
    if (!transfer) return;

    const confirmMessage = {
      dispatch: "Dispatch this transfer? This will reduce stock at source warehouse.",
      receive: "Receive this transfer? This will increase stock at destination warehouse.",
      cancel: "Cancel this transfer? This action cannot be undone.",
    }[action];

    if (!confirm(confirmMessage)) return;

    setActionLoading(action);
    try {
      if (action === "dispatch") {
        await dispatchTransfer(transferId);
      } else if (action === "receive") {
        await receiveTransfer(transferId);
      } else {
        await cancelTransfer(transferId);
      }
      router.refresh();
      const response = await getTransfer(transferId);
      setTransfer(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || `Failed to ${action} transfer`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700",
      in_transit: "bg-blue-100 text-blue-700",
      received: "bg-green-100 text-green-700",
      canceled: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`rounded-full px-3 py-1 text-sm font-medium ${
          styles[status] || styles.draft
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-gray-500">Loading transfer...</div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Transfer not found"}
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/inventory/transfers"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Transfer #{transfer.id}</h1>
            <p className="text-sm text-gray-600">Transfer details and actions</p>
          </div>
        </div>
        <div>{getStatusBadge(transfer.status)}</div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">Warehouses</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500">From</label>
              <div className="mt-1 flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {transfer.from_warehouse?.name || "Unknown"}
                </span>
                <span className="text-sm text-gray-500">
                  ({transfer.from_warehouse?.code})
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500">To</label>
              <div className="mt-1 flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-400" />
                <span className="font-medium">
                  {transfer.to_warehouse?.name || "Unknown"}
                </span>
                <span className="text-sm text-gray-500">
                  ({transfer.to_warehouse?.code})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h2 className="mb-4 text-lg font-medium">Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Created:</span>
              <span>
                {new Date(transfer.created_at).toLocaleString()}
              </span>
            </div>
            {transfer.created_by && (
              <div className="flex justify-between">
                <span className="text-gray-500">Created by:</span>
                <span>{transfer.created_by.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="mb-4 text-lg font-medium">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                  Variant ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                  SKU
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                  Product
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">
                  Quantity
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {transfer.items && transfer.items.length > 0 ? (
                transfer.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-mono text-sm">
                      #{item.variant_id}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.variant?.sku || "N/A"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.variant?.product?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.qty}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {transfer.is_draft && (
        <div className="flex gap-3">
          <button
            onClick={() => handleAction("dispatch")}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Truck className="h-4 w-4" />
            {actionLoading === "dispatch" ? "Dispatching..." : "Dispatch"}
          </button>
          <Link
            href={`/admin/inventory/transfers/${transfer.id}/edit`}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={() => handleAction("cancel")}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
            {actionLoading === "cancel" ? "Canceling..." : "Cancel"}
          </button>
        </div>
      )}

      {transfer.is_in_transit && (
        <div>
          <button
            onClick={() => handleAction("receive")}
            disabled={actionLoading !== null}
            className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Package className="h-4 w-4" />
            {actionLoading === "receive" ? "Receiving..." : "Receive Transfer"}
          </button>
        </div>
      )}
    </div>
  );
}

