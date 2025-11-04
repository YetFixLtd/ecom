"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Building2 } from "lucide-react";
import Link from "next/link";
import {
  getWarehouses,
  deleteWarehouse,
  type Warehouse,
} from "@/lib/apis/inventory";
import { AxiosError } from "axios";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchWarehouses = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        size: 15,
      };

      if (search) params.q = search;

      const response = await getWarehouses(params);
      setWarehouses(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch warehouses");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchWarehouses();
  };

  const handleDelete = async (warehouse: Warehouse) => {
    if (
      !confirm(
        `Are you sure you want to delete ${warehouse.name}? This action cannot be undone if the warehouse has inventory items.`
      )
    ) {
      return;
    }

    try {
      await deleteWarehouse(warehouse.id);
      fetchWarehouses();
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(
          err.response?.data?.message ||
            "Failed to delete warehouse. It may have inventory items."
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Warehouses</h1>
          <p className="text-sm text-gray-600">Manage your warehouse locations</p>
        </div>
        <Link
          href="/admin/inventory/warehouses/create"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Warehouse
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by name or code..."
            className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleSearch}
            className="rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
          >
            <Search className="h-4 w-4" />
          </button>
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
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Default
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
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No warehouses found
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse) => (
                  <tr key={warehouse.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm font-medium">
                          {warehouse.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{warehouse.name}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {warehouse.city && warehouse.country_code
                        ? `${warehouse.city}, ${warehouse.country_code}`
                        : warehouse.city || warehouse.country_code || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {warehouse.is_default ? (
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Default
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/inventory/warehouses/${warehouse.id}/edit`}
                          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(warehouse)}
                          className="rounded-md p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
                Showing {((currentPage - 1) * 15) + 1} to{" "}
                {Math.min(currentPage * 15, total)} of {total} warehouses
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

