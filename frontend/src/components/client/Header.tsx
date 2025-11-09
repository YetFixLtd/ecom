"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserTokenFromCookies } from "@/lib/cookies";
import { getCart } from "@/lib/apis/client/cart";
import { getCategories } from "@/lib/apis/client/categories";
import type { Category } from "@/types/client";

export default function Header() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  async function loadCategories() {
    try {
      const response = await getCategories(true);
      setCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  useEffect(() => {
    async function loadCart() {
      const token = await getUserTokenFromCookies();
      if (token) {
        setIsAuthenticated(true);
        try {
          const cartData = await getCart(token);
          setCartCount(cartData.data.items_count || 0);
          setCartTotal(cartData.data.subtotal || 0);
        } catch {
          setCartCount(0);
          setCartTotal(0);
        }
      }
    }
    loadCart();
    loadCategories();
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    router.push(`/products?${params.toString()}`);
  }

  return (
    <header className="bg-white border-b border-[#E5E5E5] relative z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 py-3 sm:py-0 sm:h-20">
          {/* Logo */}
          <div className="flex items-center shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <Link
              href="/"
              className="text-2xl sm:text-3xl font-bold text-black"
            >
              Ecom
              <span className="text-[#FFC107]">.</span>
            </Link>
            {/* Mobile Cart - shown on small screens */}
            <div className="flex items-center gap-2 sm:hidden">
              <Link
                href="/cart"
                className="relative p-2 text-black hover:text-[#FFC107] transition-colors"
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFC107] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Search Bar - Centered */}
          <form
            onSubmit={handleSearch}
            className="flex-1 w-full sm:w-auto max-w-2xl sm:mx-4 lg:mx-8 relative"
          >
            <div className="flex items-center bg-[#FFF9C4] rounded-md overflow-visible">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for Products"
                className="flex-1 px-2 sm:px-4 py-2 sm:py-3 bg-transparent border-none outline-none text-black placeholder:text-gray-600 text-sm sm:text-base"
              />
              <div className="relative z-[100]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCategoryDropdown(!showCategoryDropdown);
                  }}
                  className={`px-2 sm:px-4 py-2 sm:py-3 border-l border-[#E5E5E5] text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    selectedCategory
                      ? "bg-[#FFC107] text-black font-medium"
                      : "text-black hover:bg-[#FFC107]"
                  }`}
                >
                  {selectedCategory ? (
                    <>
                      <span className="hidden sm:inline max-w-[120px] truncate">
                        {categories.find(
                          (cat) => cat.id.toString() === selectedCategory
                        )?.name || "All Categories"}
                      </span>
                      <span className="sm:hidden max-w-[60px] truncate">
                        {categories.find(
                          (cat) => cat.id.toString() === selectedCategory
                        )?.name || "All"}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">All Categories</span>
                      <span className="sm:hidden">All</span>
                    </>
                  )}
                  <svg
                    className={`inline-block ml-1 w-3 h-3 sm:w-4 sm:h-4 transition-transform ${
                      showCategoryDropdown ? "rotate-180" : ""
                    }`}
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
                {showCategoryDropdown && (
                  <div
                    className="absolute right-0 top-full mt-1 w-48 sm:w-56 bg-white border-2 border-gray-400 rounded-md shadow-2xl z-[100] max-h-96 overflow-y-auto"
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: "0",
                      marginTop: "4px",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory("");
                        setShowCategoryDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#F5F5F5] text-sm font-semibold border-b border-gray-200"
                    >
                      All Categories
                    </button>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCategory(category.id.toString());
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-[#F5F5F5] text-sm"
                        >
                          {category.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        No categories
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="px-3 sm:px-6 py-2 sm:py-3 bg-[#FFC107] text-black hover:bg-[#FFD700] transition-colors"
                aria-label="Search"
              >
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </form>

          {/* Cart Section - Desktop */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              href="/cart"
              className="relative p-2 text-black hover:text-[#FFC107] transition-colors"
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FFC107] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated && cartTotal > 0 && (
              <span className="text-sm font-semibold text-black hidden md:inline">
                ${cartTotal.toFixed(2)}
              </span>
            )}
            {!isAuthenticated && (
              <Link
                href="/login"
                className="text-sm text-black hover:text-[#FFC107] transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
