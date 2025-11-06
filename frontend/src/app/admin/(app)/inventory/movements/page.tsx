"use client";

import { useEffect, useState } from "react";
import { Search, Activity, ArrowUp, ArrowDown } from "lucide-react";
import {
  getMovements,
  getWarehouses,
  type InventoryMovement,
  type MovementType,
  type Warehouse,
} from "@/lib/apis/inventory";
import { getProducts, type Product } from "@/lib/apis/products";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

export default function MovementsPage() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [variantFilter, setVariantFilter] = useState<string>("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  
  // Dropdown data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        size: 15,
      };

      if (variantFilter) params.variant_id = Number(variantFilter);
      if (warehouseFilter) params.warehouse_id = Number(warehouseFilter);
      if (typeFilter) params.movement_type = typeFilter as MovementType;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await getMovements(params);
      setMovements(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch movements");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [currentPage, typeFilter, dateFrom, dateTo, variantFilter, warehouseFilter]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingDropdowns(true);
      try {
        const token = await getAdminTokenFromCookies();
        if (!token) return;

        const [warehousesRes, productsRes] = await Promise.all([
          getWarehouses({ size: 100 }),
          getProducts(token, { size: 100 }),
        ]);

        setWarehouses(warehousesRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error("Failed to fetch dropdown data:", err);
      } finally {
        setLoadingDropdowns(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMovements();
  };

  const getMovementTypeBadge = (type: MovementType) => {
    const styles: Record<string, string> = {
      adjustment: "bg-blue-100 text-blue-700",
      transfer_in: "bg-green-100 text-green-700",
      transfer_out: "bg-orange-100 text-orange-700",
      reservation: "bg-purple-100 text-purple-700",
      release: "bg-yellow-100 text-yellow-700",
      sale: "bg-red-100 text-red-700",
      return: "bg-teal-100 text-teal-700",
      damaged: "bg-red-100 text-red-700",
      expired: "bg-gray-100 text-gray-700",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          styles[type] || styles.adjustment
        }`}
      >
        {type.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory Movements</h1>
        <p className="text-sm text-gray-600">
          View all inventory movements and transactions
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-sm font-medium">Product Variant</label>
            <select
              value={variantFilter}
              onChange={(e) => {
                setVariantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loadingDropdowns}
            >
              <option value="">All Variants</option>
              {products.flatMap((product) =>
                (product.variants || []).map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {product.name} - {variant.sku}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(e) => {
                setWarehouseFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              disabled={loadingDropdowns}
            >
              <option value="">All Warehouses</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Types</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer_in">Transfer In</option>
              <option value="transfer_out">Transfer Out</option>
              <option value="reservation">Reservation</option>
              <option value="release">Release</option>
              <option value="sale">Sale</option>
              <option value="return">Return</option>
              <option value="damaged">Damaged</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 rounded-md bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          {(variantFilter || warehouseFilter) && (
            <button
              onClick={() => {
                setVariantFilter("");
                setWarehouseFilter("");
                setCurrentPage(1);
                fetchMovements();
              }}
              className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          )}
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
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600">
                  Quantity Change
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Reference
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No movements found
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(movement.performed_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {movement.variant?.product?.name || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {movement.variant?.sku || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {movement.warehouse?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getMovementTypeBadge(movement.movement_type)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className={`flex items-center justify-end gap-1 font-medium ${
                          movement.qty_change > 0
                            ? "text-green-600"
                            : movement.qty_change < 0
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {movement.qty_change > 0 ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : movement.qty_change < 0 ? (
                          <ArrowDown className="h-4 w-4" />
                        ) : null}
                        {movement.qty_change > 0 ? "+" : ""}
                        {movement.qty_change}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {movement.reference_type && movement.reference_id ? (
                        <span>
                          {movement.reference_type} #{movement.reference_id}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
                {Math.min(currentPage * 15, total)} of {total} movements
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

