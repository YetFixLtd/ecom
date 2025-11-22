"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getCategories } from "@/lib/apis/client/categories";
import type { Category } from "@/types/client";

// Recursive component for mobile sidebar categories
function MobileCategoryItem({
  category,
  level = 0,
  expandedCategories,
  toggleCategory,
  onLinkClick,
}: {
  category: Category;
  level?: number;
  expandedCategories: Set<number>;
  toggleCategory: (id: number) => void;
  onLinkClick: () => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expandedCategories.has(category.id);

  // Dynamic padding based on level: px-6 (level 0), px-8 (level 1), px-10 (level 2), etc.
  const paddingClasses = ["px-6", "px-8", "px-10", "px-12", "px-14", "px-16"];
  const paddingClass = paddingClasses[level] || "px-16";

  // Debug logging
  console.log(
    `MobileCategoryItem: ${category.name} (ID: ${category.id}, Level: ${level})`,
    {
      hasChildren,
      isExpanded,
      childrenCount: category.children?.length || 0,
    }
  );

  return (
    <div
      className={
        level === 0 ? "border-b border-gray-100" : "border-t border-gray-200"
      }
    >
      <div className="flex items-center justify-between">
        <Link
          href={`/products?category=${category.id}`}
          onClick={onLinkClick}
          className={`flex-1 ${paddingClass} py-3 text-sm font-medium text-gray-800 hover:bg-[#FFF9C4] transition-colors`}
        >
          {category.name}
        </Link>
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCategory(category.id);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            className={`px-4 py-3 text-gray-600 hover:text-[#FFC107] transition-colors flex-shrink-0 ${
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
      {/* Recursively render children */}
      {hasChildren && isExpanded && category.children ? (
        <div
          className={`${
            level === 0 ? "bg-gray-50" : "bg-gray-50/50"
          } transition-all duration-200`}
          style={{ minHeight: "20px" }}
        >
          {category.children.length > 0 ? (
            <>
              {console.log(
                `Rendering ${category.children.length} children for ${category.name}`
              )}
              {category.children.map((child) => (
                <MobileCategoryItem
                  key={child.id}
                  category={child}
                  level={level + 1}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  onLinkClick={onLinkClick}
                />
              ))}
            </>
          ) : (
            <div className="px-6 py-2 text-xs text-gray-500 bg-red-100">
              No subcategories (This should not show if hasChildren is true)
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

// Recursive component to render nested category children
function CategorySubmenuItem({
  category,
  level = 0,
  expandedCategories,
  toggleCategory,
  categoryRefs,
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showDesktopDropdown, setShowDesktopDropdown] = useState(true); // Always open on desktop
  const departmentsRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  function toggleCategory(categoryId: number) {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
        console.log("Collapsed category:", categoryId);
      } else {
        newSet.add(categoryId);
        console.log(
          "Expanded category:",
          categoryId,
          "Total expanded:",
          newSet.size
        );
      }
      return newSet;
    });
  }

  useEffect(() => {
    loadCategories();
  }, []);

  // Keep dropdown open on desktop, close on mobile
  useEffect(() => {
    function handleResize() {
      if (typeof window !== "undefined") {
        if (window.innerWidth >= 1024) {
          setShowDesktopDropdown(true);
        } else {
          setShowDesktopDropdown(false);
        }
      }
    }

    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close expanded categories when clicking outside (but keep menu visible on desktop)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close expanded categories if mobile sidebar is open
      if (isMobileSidebarOpen) {
        return;
      }

      if (
        departmentsRef.current &&
        !departmentsRef.current.contains(event.target as Node)
      ) {
        setExpandedCategories(new Set());
        // Only close dropdown on mobile, keep it open on desktop
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
          setShowDesktopDropdown(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileSidebarOpen]);

  // Close mobile sidebar when clicking overlay
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  async function loadCategories() {
    try {
      const response = await getCategories();
      // API returns root categories with nested children already loaded
      console.log("Loaded categories:", response.data);
      console.log(
        "Categories with children:",
        response.data
          .filter((c) => c.children && c.children.length > 0)
          .map((c) => ({
            id: c.id,
            name: c.name,
            childrenCount: c.children?.length || 0,
          }))
      );
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
    <>
      <nav className="bg-white border-b border-[#E5E5E5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 h-12">
            {/* All Departments Button */}
            <div className="relative" ref={departmentsRef}>
              <button
                onClick={() => {
                  // On mobile, toggle sidebar; on desktop, keep menu always open
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 1024
                  ) {
                    setIsMobileSidebarOpen(!isMobileSidebarOpen);
                  }
                  // Desktop menu stays open always, no toggle needed
                }}
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
                <span className="hidden sm:inline">All Departments</span>
                <span className="sm:hidden">Menu</span>
              </button>

              {/* Desktop Dropdown - Always visible on desktop, hidden on mobile */}
              <div className="hidden lg:block absolute top-full left-0 w-80 bg-white border border-[#E5E5E5] shadow-xl z-50 mt-1 rounded-md">
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
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar - Slides in from left */}
      <div
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#E5E5E5] bg-[#FFC107]">
            <h2 className="text-lg font-bold text-black">All Departments</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-2 rounded-md hover:bg-[#FFD700] transition-colors"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
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
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto py-2">
            {/* Special Items */}
            {specialItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                onClick={() => setIsMobileSidebarOpen(false)}
                className="block px-6 py-3 text-sm font-medium text-gray-800 hover:bg-[#FFF9C4] transition-colors border-b border-gray-100"
              >
                {item.name}
              </Link>
            ))}

            {/* Regular Categories */}
            {loading ? (
              <div className="px-6 py-3 text-sm text-gray-500">Loading...</div>
            ) : (
              rootCategories.map((category) => (
                <MobileCategoryItem
                  key={category.id}
                  category={category}
                  level={0}
                  expandedCategories={expandedCategories}
                  toggleCategory={toggleCategory}
                  onLinkClick={() => setIsMobileSidebarOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
