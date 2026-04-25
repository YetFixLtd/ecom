"use client";

import { useState } from "react";
import type { Category } from "@/types/client";

interface CategoryTreeProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CategoryTree({
  categories,
  selectedId,
  onSelect,
}: CategoryTreeProps) {
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => onSelect("")}
        className={`w-full text-left px-2 py-1.5 rounded text-sm transition-colors ${
          selectedId === ""
            ? "bg-zinc-900 text-white font-medium"
            : "text-zinc-700 hover:bg-zinc-100"
        }`}
      >
        All Categories
      </button>
      {categories.map((cat) => (
        <CategoryNode
          key={cat.id}
          category={cat}
          selectedId={selectedId}
          onSelect={onSelect}
          depth={0}
        />
      ))}
    </div>
  );
}

function CategoryNode({
  category,
  selectedId,
  onSelect,
  depth,
}: {
  category: Category;
  selectedId: string;
  onSelect: (id: string) => void;
  depth: number;
}) {
  const isSelected = selectedId === String(category.id);
  const hasChildren = !!category.children?.length;
  const containsSelected = hasChildren && pathContains(category, selectedId);
  const [open, setOpen] = useState(containsSelected);

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded ${
          isSelected ? "bg-zinc-900 text-white" : "hover:bg-zinc-100"
        }`}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className={`p-1 ${
              isSelected ? "text-white" : "text-zinc-500"
            } hover:opacity-80`}
            aria-label={open ? "Collapse" : "Expand"}
          >
            <svg
              className={`w-3 h-3 transition-transform ${
                open ? "rotate-90" : ""
              }`}
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
          </button>
        ) : (
          <span className="w-5" />
        )}
        <button
          type="button"
          onClick={() => onSelect(String(category.id))}
          className={`flex-1 text-left px-1 py-1.5 text-sm ${
            isSelected ? "font-medium" : ""
          }`}
        >
          {category.name}
          {typeof category.products_count === "number" && (
            <span
              className={`ml-1 text-xs ${
                isSelected ? "text-zinc-200" : "text-zinc-500"
              }`}
            >
              ({category.products_count})
            </span>
          )}
        </button>
      </div>
      {hasChildren && open && (
        <div>
          {category.children!.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function pathContains(node: Category, targetId: string): boolean {
  if (!targetId) return false;
  if (String(node.id) === targetId) return true;
  return !!node.children?.some((c) => pathContains(c, targetId));
}

export function findCategory(
  tree: Category[],
  id: number
): Category | null {
  for (const n of tree) {
    if (n.id === id) return n;
    if (n.children?.length) {
      const found = findCategory(n.children, id);
      if (found) return found;
    }
  }
  return null;
}
