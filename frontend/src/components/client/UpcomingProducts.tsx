"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/lib/apis/client/products";
import ProductCardEnhanced from "./ProductCardEnhanced";
import type { ClientProduct } from "@/types/client";

export default function UpcomingProducts() {
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const params = { upcoming: true, per_page: 8 };
      const response = await getProducts(params);
      setProducts(response.data);
    } catch (error) {
      console.error("Error loading upcoming products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  // Don't render if no upcoming products
  if (!loading && products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <h2 className="text-2xl md:text-3xl font-bold text-black mb-8">
          Upcoming Products
        </h2>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="text-gray-500 mt-4">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCardEnhanced key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
