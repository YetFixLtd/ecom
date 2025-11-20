"use client";

import Link from "next/link";
import { getCategories } from "@/lib/apis/client/categories";
import { useState, useEffect } from "react";
import type { Category } from "@/types/client";
import { getImageUrl } from "@/lib/utils/images";
import Image from "next/image";

export default function PromotionalDeals() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      const response = await getCategories(true, true); // flat=true, featured=true
      // Get up to 6 featured categories with images
      const featuredWithImages = response.data
        .filter((cat) => cat.is_featured && cat.image_url)
        .slice(0, 6);
      setCategories(featuredWithImages);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="py-6 bg-linear-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-3 shadow-sm animate-pulse"
              >
                <div className="w-full aspect-square bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-linear-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="inline-flex items-center gap-3 rounded-full border border-yellow-primary/40 bg-white/80 px-5 py-2 text-yellow-primary text-sm font-semibold uppercase tracking-[0.25em] shadow-sm">
            <span className="inline-flex h-2.5 w-2.5 animate-ping rounded-full bg-yellow-primary/60"></span>
            Trending Now
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-yellow-primary"></span>
          </p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 -z-10 rounded-[32px] bg-white blur-3xl opacity-60"></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="group rounded-2xl border border-white/60 bg-white/90 p-5 shadow-lg shadow-yellow-primary/5 ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-yellow-primary/20"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-50 mb-4">
                  {category.image_url && (
                    <Image
                      src={getImageUrl(category.image_url)}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-yellow-primary transition-colors">
                  {category.name}
                </h3>
                <div className="inline-flex items-center text-sm font-semibold text-yellow-primary px-3 py-1.5 rounded-full bg-yellow-primary/10 group-hover:bg-yellow-primary/20 transition-colors">
                  Shop Now
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
