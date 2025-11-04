"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Eye, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import {
  getTransfers,
  type Transfer,
  type TransferStatus,
} from "@/lib/apis/inventory";
import { AxiosError } from "axios";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("");

  const fetchTransfers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        size: 15,
      };

      if (statusFilter) params.status = statusFilter as TransferStatus;

      const response = await getTransfers(params);
      setTransfers(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch transfers");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [currentPage, statusFilter]);

  const getStatusBadge = (status: TransferStatus) => {
    const styles = {
      draft: "bg-gray-100 text-gray-700",
      in_transit: "bg-blue-100 text-blue-700",
      received: "bg-green-100 text-green-700",
      canceled: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          styles[status] || styles.draft
        }`}
      >
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Transfers</h1>
          <p className="text-sm text-gray-600">
            Manage inventory transfers between warehouses
          </p>
        </div>
        <Link
          href="/admin/inventory/transfers/create"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Transfer
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_transit">In Transit</option>
              <option value="received">Received</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  From
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Created
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No transfers found
                  </td>
                </tr>
              ) : (
                transfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm">#{transfer.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {transfer.from_warehouse?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {transfer.to_warehouse?.name || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">
                        {transfer.items?.length || 0} item(s)
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(transfer.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(transfer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Link
                          href={`/admin/inventory/transfers/${transfer.id}`}
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t bg-gray-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * 15 + 1} to{" "}
                {Math.min(currentPage * 15, total)} of {total} transfers
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
