"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import type { Category } from "@/lib/apis/categories";
import { Card } from "./primitives";

interface CategoriesSectionProps {
  categories: Category[];
  selected: number[];
  onChange: (next: number[]) => void;
}

export function CategoriesSection({
  categories,
  selected,
  onChange,
}: CategoriesSectionProps) {
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map());
  const [query, setQuery] = useState("");

  const parentMap = useMemo(() => {
    const m = new Map<number, number | null>();
    categories.forEach((c) => m.set(c.id, c.parent_id ?? null));
    return m;
  }, [categories]);

  // Ancestors of all selected ids — auto-expanded by default.
  const ancestorOpen = useMemo(() => {
    const set = new Set<number>();
    for (const id of selected) {
      let cur = parentMap.get(id) ?? null;
      while (cur != null) {
        set.add(cur);
        cur = parentMap.get(cur) ?? null;
      }
    }
    return set;
  }, [selected, parentMap]);

  const isOpenFor = (id: number): boolean => {
    if (overrides.has(id)) return overrides.get(id)!;
    return ancestorOpen.has(id);
  };

  const rootCategories = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: number) =>
    categories.filter((c) => c.parent_id === id);

  const toggleExpand = (id: number) => {
    setOverrides((prev) => {
      const next = new Map(prev);
      next.set(id, !isOpenFor(id));
      return next;
    });
  };

  const toggleSelect = (id: number, checked: boolean) => {
    onChange(checked ? [...selected, id] : selected.filter((s) => s !== id));
  };

  const matchesQuery = (cat: Category): boolean => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    if (cat.name.toLowerCase().includes(q)) return true;
    return childrenOf(cat.id).some(matchesQuery);
  };

  const renderNode = (cat: Category, depth = 0) => {
    if (!matchesQuery(cat)) return null;
    const kids = childrenOf(cat.id);
    const hasKids = kids.length > 0;
    const isOpen = isOpenFor(cat.id) || query.trim().length > 0;
    const isSelected = selected.includes(cat.id);
    return (
      <div key={cat.id}>
        <div
          className={`flex items-center gap-2 rounded-md py-1.5 pr-2 hover:bg-gray-50 ${
            isSelected ? "bg-blue-50" : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          {hasKids ? (
            <button
              type="button"
              onClick={() => toggleExpand(cat.id)}
              className="rounded p-0.5 text-gray-500 hover:bg-gray-200"
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <input
            id={`cat-${cat.id}`}
            type="checkbox"
            checked={isSelected}
            onChange={(e) => toggleSelect(cat.id, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor={`cat-${cat.id}`}
            className="flex-1 cursor-pointer text-sm text-gray-800"
          >
            {cat.name}
          </label>
        </div>
        {hasKids && isOpen ? (
          <div>{kids.map((k) => renderNode(k, depth + 1))}</div>
        ) : null}
      </div>
    );
  };

  return (
    <Card
      title="Categories"
      description={
        selected.length > 0
          ? `${selected.length} selected`
          : "Pick where this product appears"
      }
    >
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="block w-full rounded-md border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-md border border-gray-200 p-2">
        {rootCategories.length === 0 ? (
          <p className="p-2 text-sm text-gray-500">No categories available</p>
        ) : (
          rootCategories.map((c) => renderNode(c))
        )}
      </div>
    </Card>
  );
}
