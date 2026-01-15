"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import ProductCard from "@/components/client/ProductCard";
import { getProducts } from "@/lib/apis/client/products";
import { getCategories } from "@/lib/apis/client/categories";
import { getBrands } from "@/lib/apis/client/brands";
import type { ClientProduct, Category, Brand } from "@/types/client";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
    per_page: 15,
  });

  // Filter states
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get("brand") || ""
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");
  const [featured, setFeatured] = useState(
    searchParams.get("featured") === "true"
  );
  const [upcoming, setUpcoming] = useState(
    searchParams.get("upcoming") === "true"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "created_at");
  const [order, setOrder] = useState<"asc" | "desc">(
    (searchParams.get("order") as "asc" | "desc") || "desc"
  );
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    search,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    featured,
    upcoming,
    sort,
    order,
  ]);

  useEffect(() => {
    loadCategories();
    loadBrands();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page,
        per_page: 15,
        sort,
        order,
      };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedBrand) params.brand = selectedBrand;
      if (minPrice) params.min_price = parseFloat(minPrice);
      if (maxPrice) params.max_price = parseFloat(maxPrice);
      if (featured) params.featured = true;
      if (upcoming) params.upcoming = true;

      const response = await getProducts(params);
      setProducts(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const response = await getCategories(true);
      setCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  async function loadBrands() {
    try {
      const response = await getBrands();
      setBrands(response.data);
    } catch (error) {
      console.error("Error loading brands:", error);
    }
  }

  function handleFilterChange() {
    setPage(1);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (featured) params.set("featured", "true");
    if (upcoming) params.set("upcoming", "true");
    if (sort !== "created_at") params.set("sort", sort);
    if (order !== "desc") params.set("order", order);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Products</h1>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleFilterChange()}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Brand
                </label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Sort By
                </label>
                <select
                  value={`${sort}-${order}`}
                  onChange={(e) => {
                    const [s, o] = e.target.value.split("-");
                    setSort(s);
                    setOrder(o as "asc" | "desc");
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                >
                  <option value="created_at-desc">Newest First</option>
                  <option value="created_at-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price Low to High</option>
                  <option value="price-desc">Price High to Low</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Min Price
                </label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Max Price
                </label>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="1000"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
              </div>
              <div className="flex items-end gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-zinc-700">
                    Featured Only
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={upcoming}
                    onChange={(e) => setUpcoming(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-zinc-700">
                    Upcoming Only
                  </span>
                </label>
              </div>
            </div>
            <button
              onClick={handleFilterChange}
              className="mt-4 bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800 transition-colors"
            >
              Apply Filters
            </button>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-zinc-500">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {meta.last_page > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 border border-zinc-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
                  >
                    Previous
                  </button>
                  <span className="text-zinc-700">
                    Page {meta.current_page} of {meta.last_page}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(meta.last_page, page + 1))}
                    disabled={page === meta.last_page}
                    className="px-4 py-2 border border-zinc-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-lg">No products found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-gray-600">Loading products...</div>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
