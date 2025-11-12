"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getProducts } from "@/lib/apis/client/products";
import ProductCardEnhanced from "./ProductCardEnhanced";
import type { ClientProduct } from "@/types/client";

export default function LazyLoadProducts() {
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadProducts = useCallback(
    async (page: number = 1, isInitial: boolean = false) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      try {
        // Load all products (not just featured)
        const params = { per_page: 12, page };
        const response = await getProducts(params);

        if (!response || !response.data) {
          throw new Error("Invalid response from server");
        }

        if (isInitial) {
          setProducts(response.data);
        } else {
          setProducts((prev) => [...prev, ...response.data]);
        }

        // Check if there are more pages
        if (response.meta) {
          setHasMore(response.meta.current_page < response.meta.last_page);
          setCurrentPage(response.meta.current_page);
        } else {
          setHasMore(false);
        }
      } catch (error: unknown) {
        console.error("Error loading products:", error);
        const errorMessage =
          (
            error as {
              response?: { data?: { message?: string } };
              message?: string;
            }
          )?.response?.data?.message ||
          (error as { message?: string })?.message ||
          "Failed to load products. Please try again.";
        setError(errorMessage);
        if (isInitial) {
          setProducts([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const loadMoreProducts = useCallback(() => {
    if (!hasMore || loadingMore || loading) return;
    loadProducts(currentPage + 1, false);
  }, [currentPage, hasMore, loadingMore, loading, loadProducts]);

  // Load initial products
  useEffect(() => {
    loadProducts(1, true);
  }, [loadProducts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMoreProducts();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Start loading 100px before reaching the bottom
      }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, loading, loadMoreProducts]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
          All Products
        </h2>

        {/* Error Message */}
        {error && (
          <div className="text-center py-4">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* Product Grid */}
        {loading && products.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-gray-500 mt-4">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCardEnhanced key={product.id} product={product} />
              ))}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <p className="text-gray-500 mt-2 text-sm">
                  Loading more products...
                </p>
              </div>
            )}

            {/* End of List Indicator */}
            {!hasMore && products.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  You&apos;ve reached the end of the list
                </p>
              </div>
            )}

            {/* Observer Target - Invisible element to trigger loading */}
            <div ref={observerTarget} className="h-4" />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>
    </section>
  );
}

