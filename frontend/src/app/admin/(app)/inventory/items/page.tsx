"use client";

import { useEffect, useState } from "react";
import { Search, Package } from "lucide-react";
import {
  getInventoryItems,
  getWarehouses,
  type InventoryItem,
  type Warehouse,
} from "@/lib/apis/inventory";
import { getProducts, type Product } from "@/lib/apis/products";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";

export default function InventoryItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [variantFilter, setVariantFilter] = useState<string>("");
  
  // Dropdown data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        size: 15,
      };

      if (search) params.q = search;
      if (warehouseFilter) params.warehouse_id = Number(warehouseFilter);
      if (variantFilter) params.variant_id = Number(variantFilter);

      const response = await getInventoryItems(params);
      setItems(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch inventory items");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, warehouseFilter, variantFilter]);

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
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inventory Items</h1>
        <p className="text-sm text-gray-600">
          View and manage inventory levels across warehouses
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by SKU or product name..."
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
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Warehouse
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  On Hand
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Reserved
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Available
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Status
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
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No inventory items found
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">
                          {item.variant?.product?.name || "Unknown Product"}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {item.variant?.sku || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {item.warehouse?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{item.on_hand}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">{item.reserved}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          item.available < 0
                            ? "font-medium text-red-600"
                            : "font-medium text-green-600"
                        }
                      >
                        {item.available}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {item.is_below_safety_stock && (
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700">
                            Low Stock
                          </span>
                        )}
                        {item.needs_reorder && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                            Reorder
                          </span>
                        )}
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
                {Math.min(currentPage * 15, total)} of {total} items
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

