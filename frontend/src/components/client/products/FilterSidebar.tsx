"use client";

import { useEffect, useState } from "react";
import type { Brand, Category } from "@/types/client";
import CategoryTree from "./CategoryTree";

export interface Filters {
  category: string;
  brand: string;
  minPrice: string;
  maxPrice: string;
  featured: boolean;
  upcoming: boolean;
}

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClearAll: () => void;
}

export default function FilterSidebar({
  categories,
  brands,
  filters,
  onChange,
  onClearAll,
}: FilterSidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-zinc-900">Filters</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-zinc-600 hover:text-zinc-900 underline"
        >
          Clear all
        </button>
      </div>

      <Section title="Categories" defaultOpen>
        <div className="max-h-72 overflow-y-auto pr-1">
          <CategoryTree
            categories={categories}
            selectedId={filters.category}
            onSelect={(id) => onChange({ category: id })}
          />
        </div>
      </Section>

      <Section title="Price" defaultOpen>
        <PriceFilter
          min={filters.minPrice}
          max={filters.maxPrice}
          onCommit={(min, max) =>
            onChange({ minPrice: min, maxPrice: max })
          }
        />
      </Section>

      <Section title="Brand" defaultOpen>
        <BrandFilter
          brands={brands}
          selectedId={filters.brand}
          onSelect={(id) => onChange({ brand: id })}
        />
      </Section>

      <Section title="Availability" defaultOpen>
        <div className="flex flex-wrap gap-2">
          <Toggle
            label="Featured"
            active={filters.featured}
            onClick={() => onChange({ featured: !filters.featured })}
          />
          <Toggle
            label="Upcoming"
            active={filters.upcoming}
            onClick={() => onChange({ upcoming: !filters.upcoming })}
          />
        </div>
      </Section>
    </aside>
  );
}

function Section({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-zinc-200 pt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-medium text-zinc-900 mb-2"
      >
        <span>{title}</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "" : "-rotate-90"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-500"
      }`}
    >
      {label}
    </button>
  );
}

function PriceFilter({
  min,
  max,
  onCommit,
}: {
  min: string;
  max: string;
  onCommit: (min: string, max: string) => void;
}) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);

  useEffect(() => setLocalMin(min), [min]);
  useEffect(() => setLocalMax(max), [max]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (localMin !== min || localMax !== max) {
        onCommit(localMin, localMax);
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localMin, localMax]);

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        value={localMin}
        onChange={(e) => setLocalMin(e.target.value)}
        placeholder="Min"
        className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
      <span className="text-zinc-400">–</span>
      <input
        type="number"
        min={0}
        value={localMax}
        onChange={(e) => setLocalMax(e.target.value)}
        placeholder="Max"
        className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-500"
      />
    </div>
  );
}

function BrandFilter({
  brands,
  selectedId,
  onSelect,
}: {
  brands: Brand[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = query
    ? brands.filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase())
      )
    : brands;

  return (
    <div className="space-y-2">
      {brands.length > 8 && (
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search brands"
          className="w-full px-2 py-1.5 text-sm border border-zinc-300 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      )}
      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1">
        <label className="flex items-center gap-2 px-1 py-1 text-sm text-zinc-700 cursor-pointer hover:bg-zinc-50 rounded">
          <input
            type="radio"
            name="brand"
            checked={selectedId === ""}
            onChange={() => onSelect("")}
          />
          <span>All</span>
        </label>
        {filtered.map((b) => (
          <label
            key={b.id}
            className="flex items-center gap-2 px-1 py-1 text-sm text-zinc-700 cursor-pointer hover:bg-zinc-50 rounded"
          >
            <input
              type="radio"
              name="brand"
              checked={selectedId === String(b.id)}
              onChange={() => onSelect(String(b.id))}
            />
            <span className="flex-1 truncate">{b.name}</span>
            {typeof b.products_count === "number" && (
              <span className="text-xs text-zinc-500">
                ({b.products_count})
              </span>
            )}
          </label>
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-500 px-1 py-2">No brands match</p>
        )}
      </div>
    </div>
  );
}
