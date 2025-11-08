"use client";

import Link from "next/link";
import { getCategories } from "@/lib/apis/client/categories";
import { useState, useEffect } from "react";
import type { Category } from "@/types/client";

export default function PromotionalDeals() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await getCategories(true);
      // Get first 4 categories for promotional deals
      setCategories(response.data.slice(0, 4));
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  // Fallback category names if API doesn't return enough
  const fallbackNames = ["Cameras", "Laptops", "Desktops", "Earbuds"];
  const fallbackIcons = ["📷", "💻", "🖥️", "🎧"];

  // Ensure we always have 4 items to display
  const displayItems = Array.from({ length: 4 }, (_, index) => {
    if (index < categories.length) {
      return { type: "category" as const, data: categories[index] };
    } else {
      const fallbackIndex = index - categories.length;
      return {
        type: "fallback" as const,
        name: fallbackNames[fallbackIndex],
        icon: fallbackIcons[fallbackIndex],
      };
    }
  });

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayItems.map((item, index) => {
            const categoryName =
              item.type === "category" ? item.data.name : item.name;
            const categoryId =
              item.type === "category" ? item.data.id : undefined;

            return (
              <div
                key={index}
                className="bg-white border border-[#E5E5E5] rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {item.type === "fallback" ? (
                    <div className="text-6xl">{item.icon}</div>
                  ) : (
                    <div className="w-24 h-24 bg-[#F5F5F5] rounded-lg flex items-center justify-center">
                      <span className="text-4xl">📦</span>
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-semibold text-black mb-2">
                      CATCH BIG DEALS ON THE {categoryName.toUpperCase()}
                    </h3>
                    <Link
                      href={
                        categoryId
                          ? `/products?category=${categoryId}`
                          : `/products`
                      }
                      className="inline-block bg-[#FFC107] text-black text-sm font-semibold px-4 py-2 rounded-md hover:bg-[#FFD700] transition-colors"
                    >
                      Shop now &gt;
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

