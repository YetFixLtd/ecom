"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { getProducts, type Product, deleteProduct } from "@/lib/apis/products";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import { getImageUrl } from "@/lib/utils/images";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [stockoutFilter, setStockoutFilter] = useState<boolean>(false);
  const [zeroPriceFilter, setZeroPriceFilter] = useState<boolean>(false);
  const [upcomingFilter, setUpcomingFilter] = useState<boolean>(false);
  const [callForPriceFilter, setCallForPriceFilter] = useState<boolean>(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        size: 15,
      };

      if (search) params.q = search;
      if (brandFilter) params.brand_id = Number(brandFilter);
      if (categoryFilter) params.category_id = Number(categoryFilter);
      if (statusFilter) params.published_status = statusFilter;
      if (stockoutFilter) params.stockout = true;
      if (zeroPriceFilter) params.zero_price = true;
      if (upcomingFilter) params.is_upcoming = true;
      if (callForPriceFilter) params.call_for_price = true;

      const response = await getProducts(token, params);
      setProducts(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch products");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, brandFilter, categoryFilter, statusFilter, stockoutFilter, zeroPriceFilter, upcomingFilter, callForPriceFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete ${product.name}?`)) {
      return;
    }

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      await deleteProduct(token, product.id);
      fetchProducts();
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to delete product");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-gray-600">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/catalog/products/create"
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search by name, slug, or SKU..."
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
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="stockout"
              checked={stockoutFilter}
              onChange={(e) => {
                setStockoutFilter(e.target.checked);
                setCurrentPage(1);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="stockout" className="text-sm font-medium text-gray-700">
              Stockout Items
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="zero-price"
              checked={zeroPriceFilter}
              onChange={(e) => {
                setZeroPriceFilter(e.target.checked);
                setCurrentPage(1);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="zero-price" className="text-sm font-medium text-gray-700">
              Zero Price Items
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="upcoming"
              checked={upcomingFilter}
              onChange={(e) => {
                setUpcomingFilter(e.target.checked);
                setCurrentPage(1);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="upcoming" className="text-sm font-medium text-gray-700">
              Upcoming Products
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="call-for-price"
              checked={callForPriceFilter}
              onChange={(e) => {
                setCallForPriceFilter(e.target.checked);
                setCurrentPage(1);
              }}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="call-for-price" className="text-sm font-medium text-gray-700">
              Call for Price
            </label>
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
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">
                  Brand
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
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.primary_image_path ? (
                          <img
                            src={getImageUrl(product.primary_image_path)}
                            alt={product.name}
                            className="h-12 w-12 rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                        {product.product_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            product.published_status === "published"
                              ? "bg-green-100 text-green-700"
                              : product.published_status === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.published_status}
                        </span>
                        {product.is_upcoming && (
                          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                            Upcoming
                          </span>
                        )}
                        {product.call_for_price && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">
                            Call for Price
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.brand?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/catalog/products/${product.id}/edit`}
                          className="rounded p-1 text-gray-600 hover:bg-gray-100"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
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
          <div className="flex items-center justify-between border-t px-4 py-3">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 15 + 1} to{" "}
              {Math.min(currentPage * 15, total)} of {total} results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`rounded-md px-3 py-1 text-sm ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
