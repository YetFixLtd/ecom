"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getCategories } from "@/lib/apis/client/categories";
import type { Category } from "@/types/client";

// Recursive component to render nested category children
function CategorySubmenuItem({
  category,
  level = 0,
  expandedCategories,
  toggleCategory,
  categoryRefs,
  parentElement,
}: {
  category: Category;
  level?: number;
  expandedCategories: Set<number>;
  toggleCategory: (id: number) => void;
  categoryRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);
  const [submenuPosition, setSubmenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  useEffect(() => {
    if (isExpanded && hasChildren) {
      // Use requestAnimationFrame to avoid synchronous setState
      const frameId = requestAnimationFrame(() => {
        const element = categoryRefs.current.get(category.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          const windowWidth = window.innerWidth;
          const isMobile = windowWidth < 768;

          // On mobile, show submenu below or adjust position
          let left = rect.right + 8;
          if (isMobile) {
            left = rect.left;
          } else if (left + 256 > windowWidth) {
            // If submenu would go off screen, position it to the left
            left = rect.left - 256 - 8;
          }

          setSubmenuPosition({
            top: rect.top,
            left: left,
          });
        }
      });
      return () => cancelAnimationFrame(frameId);
    } else {
      const frameId = requestAnimationFrame(() => {
        setSubmenuPosition(null);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [isExpanded, hasChildren, category.id, categoryRefs]);

  return (
    <>
      <div
        ref={(el) => {
          if (el) categoryRefs.current.set(category.id, el);
          else categoryRefs.current.delete(category.id);
        }}
        className="relative"
      >
        <div className="flex items-center justify-between">
          <Link
            href={`/products?category=${category.id}`}
            className={`flex-1 block px-6 py-2 text-sm text-gray-700 hover:bg-[#FFF9C4] transition-colors ${
              level > 0 ? "pl-10" : ""
            }`}
          >
            {category.name}
          </Link>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className={`px-3 py-2 text-gray-600 hover:text-[#FFC107] transition-colors ${
                isExpanded ? "text-[#FFC107]" : ""
              }`}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              <svg
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? "rotate-90" : ""
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
          )}
        </div>
      </div>

      {/* Recursive submenu for nested children - shown as side panel when expanded */}
      {hasChildren &&
        isExpanded &&
        category.children &&
        category.children.length > 0 &&
        submenuPosition && (
          <div
            className="fixed w-64 md:w-64 sm:w-56 bg-white border border-[#E5E5E5] shadow-2xl rounded-md overflow-hidden z-[60] max-h-[600px] overflow-y-auto"
            style={{
              left: `${submenuPosition.left}px`,
              top: `${submenuPosition.top}px`,
              maxWidth: "calc(100vw - 16px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                {category.name}
              </div>
              {category.children.map((child) => (
                <CategorySubmenuItem
                  key={child.id}
                  category={child}
                  level={level + 1}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  categoryRefs={categoryRefs}
                />
              ))}
            </div>
          </div>
        )}
    </>
  );
}

export default function TopNavigation() {
  const [showSuperDealsDropdown, setShowSuperDealsDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const departmentsRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  function toggleCategory(categoryId: number) {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // Close expanded categories when clicking outside (but keep menu visible)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        departmentsRef.current &&
        !departmentsRef.current.contains(event.target as Node)
      ) {
        setExpandedCategories(new Set());
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function loadCategories() {
    try {
      const response = await getCategories();
      // API returns root categories with nested children already loaded
      setCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoading(false);
    }
  }

  // API already returns root categories (no parent_id) with nested children
  const rootCategories = categories;

  // Special items that don't have dropdowns
  const specialItems: { name: string; href: string }[] = [
    // { name: "Value of the Day", href: "/products?featured=true" },
    // { name: "Top 100 Offers", href: "/products?sort=price&order=asc" },
    // { name: "New Arrivals", href: "/products?sort=created_at&order=desc" },
  ];

  return (
    <nav className="bg-white border-b border-[#E5E5E5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-8 h-12">
          {/* All Departments Dropdown */}
          <div className="relative" ref={departmentsRef}>
            <button
              className="flex items-center bg-[#FFC107] text-black font-bold px-4 py-2 rounded-md hover:bg-[#FFD700] transition-colors h-10"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              All Departments
            </button>
            <div className="absolute top-full left-0 w-80 bg-white border border-[#E5E5E5] shadow-xl z-50 mt-1 rounded-md">
                <div className="py-2 max-h-[600px] overflow-y-auto">
                  {/* Special Items */}
                  {specialItems.map((item, index) => (
                    <Link
                      key={index}
                      href={item.href}
                      className="block px-6 py-3 text-sm font-medium text-gray-800 hover:bg-[#FFF9C4] transition-colors border-b border-gray-100"
                    >
                      {item.name}
                    </Link>
                  ))}

                  {/* Regular Categories */}
                  {loading ? (
                    <div className="px-6 py-3 text-sm text-gray-500">
                      Loading...
                    </div>
                  ) : (
                    rootCategories.map((category) => {
                      // Use the nested children from the API response
                      const hasChildren =
                        category.children && category.children.length > 0;
                      const isExpanded = expandedCategories.has(category.id);

                      return (
                        <div
                          key={category.id}
                          ref={(el) => {
                            if (el) categoryRefs.current.set(category.id, el);
                            else categoryRefs.current.delete(category.id);
                          }}
                          className="relative border-b border-gray-100"
                        >
                          <div className="flex items-center justify-between">
                            <Link
                              href={`/products?category=${category.id}`}
                              className="flex-1 px-6 py-3 text-sm font-medium text-gray-800 hover:bg-[#FFF9C4] transition-colors"
                            >
                              {category.name}
                            </Link>
                            {hasChildren && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleCategory(category.id);
                                }}
                                className={`px-4 py-3 text-gray-600 hover:text-[#FFC107] transition-colors ${
                                  isExpanded ? "text-[#FFC107]" : ""
                                }`}
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
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
                            )}
                          </div>

                          {/* Subcategory Submenu - shown as side panel when expanded */}
                          {hasChildren &&
                            isExpanded &&
                            category.children &&
                            category.children.length > 0 && (
                              <>
                                {(() => {
                                  const element = categoryRefs.current.get(
                                    category.id
                                  );
                                  if (!element) return null;
                                  const rect = element.getBoundingClientRect();
                                  const windowWidth =
                                    typeof window !== "undefined"
                                      ? window.innerWidth
                                      : 1024;
                                  const isMobile = windowWidth < 768;
                                  let left = rect.right + 8;
                                  if (isMobile) {
                                    left = rect.left;
                                  } else if (left + 256 > windowWidth) {
                                    left = rect.left - 256 - 8;
                                  }

                                  return (
                                    <div
                                      className="fixed w-64 md:w-64 sm:w-56 bg-white border border-[#E5E5E5] shadow-2xl rounded-md overflow-hidden z-[60] max-h-[600px] overflow-y-auto"
                                      style={{
                                        left: `${left}px`,
                                        top: `${rect.top}px`,
                                        maxWidth: "calc(100vw - 16px)",
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="py-2">
                                        <div className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                          {category.name}
                                        </div>
                                        {category.children.map((child) => (
                                          <CategorySubmenuItem
                                            key={child.id}
                                            category={child}
                                            level={0}
                                            expandedCategories={
                                              expandedCategories
                                            }
                                            toggleCategory={toggleCategory}
                                            categoryRefs={categoryRefs}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
          </div>

          <div className="relative">
            <button
              onMouseEnter={() => setShowSuperDealsDropdown(true)}
              onMouseLeave={() => setShowSuperDealsDropdown(false)}
              className="flex items-center text-sm font-medium text-black hover:text-[#FFC107] transition-colors"
            >
              Super Deals
              <svg
                className="ml-1 w-4 h-4"
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
            {showSuperDealsDropdown && (
              <div
                onMouseEnter={() => setShowSuperDealsDropdown(true)}
                onMouseLeave={() => setShowSuperDealsDropdown(false)}
                className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#E5E5E5] rounded-md shadow-lg z-50"
              >
                <Link
                  href="/products?featured=true"
                  className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                >
                  Featured Products
                </Link>
                <Link
                  href="/products?sort=price&order=asc"
                  className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                >
                  Best Prices
                </Link>
                <Link
                  href="/products?sort=created_at&order=desc"
                  className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                >
                  New Arrivals
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/brands"
            className="text-sm font-medium text-black hover:text-[#FFC107] transition-colors"
          >
            Featured Brands
          </Link>

          <Link
            href="/products?featured=true"
            className="text-sm font-medium text-black hover:text-[#FFC107] transition-colors"
          >
            Trending Styles
          </Link>

          <Link
            href="/gift-cards"
            className="text-sm font-medium text-black hover:text-[#FFC107] transition-colors"
          >
            Gift Cards
          </Link>
        </div>
      </div>
    </nav>
  );
}
