"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronRight,
  ChevronDown,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  getCategories,
  type Category,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "@/lib/apis/categories";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { AxiosError } from "axios";
import { CreateCategoryModal } from "@/components/admin/catalog/CreateCategoryModal";
import { EditCategoryModal } from "@/components/admin/catalog/EditCategoryModal";
import { getImageUrl } from "@/lib/utils/images";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [parentFilter, setParentFilter] = useState<number | null | "all">(
    "all"
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const params: Record<string, string | number | boolean | null> = {
        include_all: true,
        with_children: true,
        with_parent: true,
      };

      if (search) params.q = search;
      if (parentFilter !== "all" && parentFilter !== null) {
        params.parent_id = parentFilter;
      }

      const response = await getCategories(token, params);
      setCategories(response.data);
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Failed to fetch categories");
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [parentFilter]);

  const handleSearch = () => {
    fetchCategories();
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete ${category.name}?`)) {
      return;
    }

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      await deleteCategory(token, category.id);
      fetchCategories();
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to delete category");
      }
    }
  };

  const toggleExpand = (categoryId: number) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const rootCategories = categories
    .filter((cat) => !cat.parent_id)
    .sort((a, b) => a.position - b.position);
  const getChildren = (parentId: number) =>
    categories
      .filter((cat) => cat.parent_id === parentId)
      .sort((a, b) => a.position - b.position);

  // Get siblings of a category (categories with same parent), sorted by position
  const getSiblings = (category: Category) => {
    return categories
      .filter((cat) => cat.parent_id === category.parent_id)
      .sort((a, b) => a.position - b.position);
  };

  const handleMoveUp = async (category: Category) => {
    const siblings = getSiblings(category);
    const currentIndex = siblings.findIndex((c) => c.id === category.id);

    if (currentIndex <= 0) return; // Already at top

    const previousCategory = siblings[currentIndex - 1];
    setReordering(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      // Swap positions
      await reorderCategories(token, [
        { id: category.id, position: previousCategory.position },
        { id: previousCategory.id, position: category.position },
      ]);

      fetchCategories();
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to reorder categories");
      }
    } finally {
      setReordering(false);
    }
  };

  const handleMoveDown = async (category: Category) => {
    const siblings = getSiblings(category);
    const currentIndex = siblings.findIndex((c) => c.id === category.id);

    if (currentIndex >= siblings.length - 1) return; // Already at bottom

    const nextCategory = siblings[currentIndex + 1];
    setReordering(true);

    try {
      const token = await getAdminTokenFromCookies();
      if (!token) return;

      // Swap positions
      await reorderCategories(token, [
        { id: category.id, position: nextCategory.position },
        { id: nextCategory.id, position: category.position },
      ]);

      fetchCategories();
    } catch (err) {
      if (err instanceof AxiosError) {
        alert(err.response?.data?.message || "Failed to reorder categories");
      }
    } finally {
      setReordering(false);
    }
  };

  const renderCategory = (category: Category, level = 0) => {
    const children = getChildren(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    // Determine if we can move up/down within siblings
    const siblings = getSiblings(category);
    const siblingIndex = siblings.findIndex((c) => c.id === category.id);
    const canMoveUp = siblingIndex > 0;
    const canMoveDown = siblingIndex < siblings.length - 1;

    return (
      <div key={category.id}>
        <div
          className="flex items-center gap-3 border-b px-4 py-3 hover:bg-gray-50"
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(category.id)}
              className="rounded p-0.5 hover:bg-gray-200"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          {/* Category Image */}
          {category.image_url ? (
            <img
              src={getImageUrl(category.image_url)}
              alt={category.name}
              className="h-10 w-10 rounded-md object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
              <ImageIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{category.name}</span>
              {category.status === "inactive" && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Inactive
                </span>
              )}
              {category.is_featured && (
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  Featured
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {category.slug}{" "}
              {category.products_count !== undefined &&
                `• ${category.products_count} products`}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Reorder buttons */}
            <button
              onClick={() => handleMoveUp(category)}
              disabled={!canMoveUp || reordering}
              className={`rounded p-1 ${
                canMoveUp && !reordering
                  ? "text-gray-600 hover:bg-gray-100"
                  : "cursor-not-allowed text-gray-300"
              }`}
              title="Move up"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleMoveDown(category)}
              disabled={!canMoveDown || reordering}
              className={`rounded p-1 ${
                canMoveDown && !reordering
                  ? "text-gray-600 hover:bg-gray-100"
                  : "cursor-not-allowed text-gray-300"
              }`}
              title="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <div className="mx-1 h-4 w-px bg-gray-200" />
            {/* Action buttons */}
            <button
              onClick={() => {
                setParentCategoryId(category.id);
                setShowCreateModal(true);
              }}
              className="rounded p-1 text-gray-600 hover:bg-gray-100"
              title="Add subcategory"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditingCategory(category)}
              className="rounded p-1 text-gray-600 hover:bg-gray-100"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(category)}
              className="rounded p-1 text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>{children.map((child) => renderCategory(child, level + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-gray-600">
            Organize products into categories and subcategories
          </p>
        </div>
        <button
          onClick={() => {
            setParentCategoryId(null);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Search categories..."
                className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                onClick={handleSearch}
                className="rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Filter by Parent
            </label>
            <select
              value={parentFilter === "all" ? "all" : parentFilter || ""}
              onChange={(e) => {
                const value = e.target.value;
                setParentFilter(
                  value === "all" ? "all" : value === "" ? null : Number(value)
                );
              }}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="all">All Categories</option>
              <option value="">Root Categories Only</option>
              {rootCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Categories Tree */}
      <div className="rounded-lg border bg-white">
        {loading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            No categories found
          </div>
        ) : (
          <div>
            {rootCategories.map((category) => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateCategoryModal
          parentId={parentCategoryId}
          onClose={() => {
            setShowCreateModal(false);
            setParentCategoryId(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setParentCategoryId(null);
            fetchCategories();
          }}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          categories={categories}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            fetchCategories();
          }}
        />
      )}
    </div>
  );
}
