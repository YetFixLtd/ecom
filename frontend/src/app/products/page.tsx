"use client";

import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import ProductCard from "@/components/client/ProductCard";
import FilterSidebar from "@/components/client/products/FilterSidebar";
import ActiveFilterChips from "@/components/client/products/ActiveFilterChips";
import { findCategory } from "@/components/client/products/CategoryTree";
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
    per_page: 20,
  });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const minPrice = searchParams.get("min_price") || "";
  const maxPrice = searchParams.get("max_price") || "";
  const featured = searchParams.get("featured") === "true";
  const upcoming = searchParams.get("upcoming") === "true";
  const sort = searchParams.get("sort") || "created_at";
  const order = (searchParams.get("order") as "asc" | "desc") || "desc";
  const perPage = parseInt(searchParams.get("per_page") || "20");
  const page = parseInt(searchParams.get("page") || "1");

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchInput === search) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: searchInput || null, page: null });
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    perPage,
    search,
    category,
    brand,
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
        per_page: perPage,
        sort,
        order,
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (brand) params.brand = brand;
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
      const response = await getCategories();
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

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products");
  }

  const currentCategory = useMemo(
    () => (category ? findCategory(categories, parseInt(category)) : null),
    [categories, category]
  );
  const subcategories = currentCategory?.children ?? [];

  const filters = {
    category,
    brand,
    minPrice,
    maxPrice,
    featured,
    upcoming,
  };

  const activeFilters = { ...filters, search };

  function handleFilterChange(next: Partial<typeof filters>) {
    const updates: Record<string, string | null> = { page: null };
    if ("category" in next) updates.category = next.category || null;
    if ("brand" in next) updates.brand = next.brand || null;
    if ("minPrice" in next) updates.min_price = next.minPrice || null;
    if ("maxPrice" in next) updates.max_price = next.maxPrice || null;
    if ("featured" in next) updates.featured = next.featured ? "true" : null;
    if ("upcoming" in next) updates.upcoming = next.upcoming ? "true" : null;
    updateParams(updates);
  }

  function clearChip(key: keyof typeof activeFilters | "price") {
    if (key === "price") {
      updateParams({ min_price: null, max_price: null, page: null });
    } else if (key === "search") {
      setSearchInput("");
      updateParams({ search: null, page: null });
    } else if (key === "featured" || key === "upcoming") {
      updateParams({ [key]: null, page: null });
    } else {
      const apiKey = key === "minPrice" ? "min_price" : key === "maxPrice" ? "max_price" : key;
      updateParams({ [apiKey]: null, page: null });
    }
  }

  function clearAll() {
    setSearchInput("");
    router.replace("/products");
  }

  const hasFilters =
    !!search ||
    !!category ||
    !!brand ||
    !!minPrice ||
    !!maxPrice ||
    featured ||
    upcoming;

  const startIdx = (meta.current_page - 1) * meta.per_page + 1;
  const endIdx = Math.min(
    meta.current_page * meta.per_page,
    meta.total
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="text-sm text-zinc-500 mb-2">
            <Link href="/" className="hover:text-zinc-900">
              Home
            </Link>
            <span className="mx-2">/</span>
            <Link href="/products" className="hover:text-zinc-900">
              Products
            </Link>
            {currentCategory && (
              <>
                <span className="mx-2">/</span>
                <span className="text-zinc-900">{currentCategory.name}</span>
              </>
            )}
          </nav>

          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 mb-4">
            {currentCategory ? currentCategory.name : "All Products"}
          </h1>

          {/* Subcategory chips */}
          {subcategories.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() =>
                    handleFilterChange({ category: String(sub.id) })
                  }
                  className="flex items-center gap-2 px-3 py-1.5 bg-white border border-zinc-200 rounded-full hover:border-zinc-400 hover:bg-zinc-50 transition-colors text-sm text-zinc-800"
                >
                  {sub.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sub.image_url}
                      alt={sub.name}
                      className="w-5 h-5 object-cover rounded"
                    />
                  )}
                  <span>{sub.name}</span>
                  {typeof sub.products_count === "number" && (
                    <span className="text-xs text-zinc-500">
                      ({sub.products_count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar — desktop */}
            <div className="hidden lg:block">
              <div className="sticky top-4">
                <FilterSidebar
                  categories={categories}
                  brands={brands}
                  filters={filters}
                  onChange={handleFilterChange}
                  onClearAll={clearAll}
                />
              </div>
            </div>

            {/* Sidebar — mobile drawer */}
            {mobileFiltersOpen && (
              <div className="lg:hidden fixed inset-0 z-50 flex">
                <div
                  className="fixed inset-0 bg-black/40"
                  onClick={() => setMobileFiltersOpen(false)}
                />
                <div className="relative bg-white w-80 max-w-full h-full overflow-y-auto p-4 ml-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Filters</h3>
                    <button
                      type="button"
                      onClick={() => setMobileFiltersOpen(false)}
                      aria-label="Close"
                      className="p-1 text-zinc-500 hover:text-zinc-900"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <FilterSidebar
                    categories={categories}
                    brands={brands}
                    filters={filters}
                    onChange={handleFilterChange}
                    onClearAll={clearAll}
                  />
                </div>
              </div>
            )}

            {/* Main column */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="bg-white rounded-lg border border-zinc-200 p-3 mb-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 rounded-md text-sm hover:bg-zinc-50"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 4h18M6 12h12M10 20h4"
                    />
                  </svg>
                  Filters
                </button>

                <div className="flex-1 min-w-[180px]">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products..."
                    className="w-full px-3 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  />
                </div>

                <span className="text-xs text-zinc-500 hidden sm:block">
                  {meta.total > 0
                    ? `Showing ${startIdx}–${endIdx} of ${meta.total}`
                    : "No results"}
                </span>

                <select
                  value={`${sort}-${order}`}
                  onChange={(e) => {
                    const [s, o] = e.target.value.split("-");
                    updateParams({ sort: s, order: o, page: null });
                  }}
                  className="px-2 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="created_at-desc">Newest</option>
                  <option value="created_at-asc">Oldest</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="price-asc">Price ↑</option>
                  <option value="price-desc">Price ↓</option>
                </select>

                <select
                  value={String(perPage)}
                  onChange={(e) =>
                    updateParams({ per_page: e.target.value, page: null })
                  }
                  className="px-2 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-500"
                >
                  <option value="20">20</option>
                  <option value="40">40</option>
                  <option value="80">80</option>
                </select>
              </div>

              <ActiveFilterChips
                filters={activeFilters}
                categories={categories}
                brands={brands}
                onClear={clearChip}
              />

              {/* Grid */}
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-zinc-100 animate-pulse rounded-lg aspect-[3/4]"
                    />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {meta.last_page > 1 && (
                    <Pagination
                      current={meta.current_page}
                      last={meta.last_page}
                      onPage={(p) => updateParams({ page: String(p) })}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-white border border-zinc-200 rounded-lg">
                  <p className="text-zinc-700 text-lg mb-2">No products found</p>
                  {hasFilters && (
                    <button
                      onClick={clearAll}
                      className="text-sm text-zinc-600 hover:text-zinc-900 underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Pagination({
  current,
  last,
  onPage,
}: {
  current: number;
  last: number;
  onPage: (p: number) => void;
}) {
  const pages = pageWindow(current, last);
  return (
    <div className="flex justify-center items-center gap-1 flex-wrap">
      <button
        onClick={() => onPage(Math.max(1, current - 1))}
        disabled={current === 1}
        className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
      >
        «
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-zinc-500">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`min-w-[36px] px-2 py-1.5 border rounded-md text-sm ${
              p === current
                ? "bg-zinc-900 text-white border-zinc-900"
                : "border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPage(Math.min(last, current + 1))}
        disabled={current === last}
        className="px-3 py-1.5 border border-zinc-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50"
      >
        »
      </button>
    </div>
  );
}

function pageWindow(current: number, last: number): Array<number | "…"> {
  const out: Array<number | "…"> = [];
  const push = (n: number | "…") => out.push(n);
  const window = 1;
  for (let i = 1; i <= last; i++) {
    if (
      i === 1 ||
      i === last ||
      (i >= current - window && i <= current + window)
    ) {
      push(i);
    } else if (out[out.length - 1] !== "…") {
      push("…");
    }
  }
  return out;
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
