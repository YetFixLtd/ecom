"use client";

import { useState, useEffect } from "react";
import { getProducts } from "@/lib/apis/client/products";
import ProductCardEnhanced from "./ProductCardEnhanced";
import type { ClientProduct } from "@/types/client";

export default function ProductTabs() {
  const [activeTab, setActiveTab] = useState<"featured" | "onsale" | "toprated">(
    "featured"
  );
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [activeTab]);

  async function loadProducts() {
    setLoading(true);
    try {
      let params: any = { per_page: 8 };
      
      if (activeTab === "featured") {
        params.featured = true;
      } else if (activeTab === "onsale") {
        // For on sale, we'll get products with compare_at_price > price
        // This is a simplified approach - you might want to add a sale filter to the API
        params.sort = "price";
        params.order = "asc";
      } else if (activeTab === "toprated") {
        // For top rated, we'll sort by created_at as a proxy
        // You might want to add a rating system to the API
        params.sort = "created_at";
        params.order = "desc";
      }

      const response = await getProducts(params);
      setProducts(response.data);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-8 border-b border-[#E5E5E5] mb-8">
          <button
            onClick={() => setActiveTab("featured")}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === "featured"
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Featured
            {activeTab === "featured" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFC107]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("onsale")}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === "onsale"
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            On Sale
            {activeTab === "onsale" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFC107]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("toprated")}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === "toprated"
                ? "text-black"
                : "text-gray-600 hover:text-black"
            }`}
          >
            Top Rated
            {activeTab === "toprated" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFC107]" />
            )}
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCardEnhanced key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found.</p>
          </div>
        )}
      </div>
    </section>
  );
}

