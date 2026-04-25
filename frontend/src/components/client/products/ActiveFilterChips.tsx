"use client";

import type { Brand, Category } from "@/types/client";
import { findCategory } from "./CategoryTree";

export interface ActiveFilters {
  search: string;
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  featured: boolean;
  upcoming: boolean;
}

interface Props {
  filters: ActiveFilters;
  categories: Category[];
  brands: Brand[];
  onClear: (key: keyof ActiveFilters | "price") => void;
}

export default function ActiveFilterChips({
  filters,
  categories,
  brands,
  onClear,
}: Props) {
  const chips: Array<{ key: string; label: string; clear: () => void }> = [];

  if (filters.search) {
    chips.push({
      key: "search",
      label: `Search: "${filters.search}"`,
      clear: () => onClear("search"),
    });
  }
  if (filters.category) {
    const cat = findCategory(categories, parseInt(filters.category));
    chips.push({
      key: "category",
      label: `Category: ${cat?.name ?? filters.category}`,
      clear: () => onClear("category"),
    });
  }
  if (filters.brand) {
    const b = brands.find((x) => String(x.id) === filters.brand);
    chips.push({
      key: "brand",
      label: `Brand: ${b?.name ?? filters.brand}`,
      clear: () => onClear("brand"),
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    const lo = filters.minPrice || "0";
    const hi = filters.maxPrice || "∞";
    chips.push({
      key: "price",
      label: `$${lo} – $${hi}`,
      clear: () => onClear("price"),
    });
  }
  if (filters.featured) {
    chips.push({
      key: "featured",
      label: "Featured",
      clear: () => onClear("featured"),
    });
  }
  if (filters.upcoming) {
    chips.push({
      key: "upcoming",
      label: "Upcoming",
      clear: () => onClear("upcoming"),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={c.clear}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs rounded-full transition-colors"
        >
          <span>{c.label}</span>
          <svg
            className="w-3 h-3"
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
      ))}
    </div>
  );
}
