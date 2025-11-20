"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getUserTokenFromCookies } from "@/lib/cookies";
import { getCart } from "@/lib/apis/client/cart";
import { getCategories } from "@/lib/apis/client/categories";
import { getPublicSettings } from "@/lib/apis/settings";
import { logout } from "@/lib/apis/auth";
import { getImageUrl } from "@/lib/utils/images";
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [siteName, setSiteName] = useState("E-Commerce");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  async function loadCategories() {
    try {
      const response = await getCategories(true);
      setCategories(response.data);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  async function loadSettings() {
    try {
      const response = await getPublicSettings();
      setSiteName(response.data.site_name || "E-Commerce");
      if (response.data.site_logo_url) {
        setLogoUrl(getImageUrl(response.data.site_logo_url));
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  }

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showUserMenu]);

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
      } else {
        // Load guest cart from localStorage
        setIsAuthenticated(false);
        try {
          const { getGuestCartCount, getGuestCartTotal } = await import("@/lib/utils/guestCart");
          setCartCount(getGuestCartCount());
          setCartTotal(getGuestCartTotal());
        } catch {
          setCartCount(0);
          setCartTotal(0);
        }
      }
    }
    loadCart();
    loadCategories();
    loadSettings();
    
    // Listen for storage changes to update cart count when guest cart changes
    if (typeof window !== "undefined") {
      const handleCartUpdate = async () => {
        const token = await getUserTokenFromCookies();
        if (!token) {
          try {
            const { getGuestCartCount, getGuestCartTotal } = await import("@/lib/utils/guestCart");
            setCartCount(getGuestCartCount());
            setCartTotal(getGuestCartTotal());
          } catch {
            setCartCount(0);
            setCartTotal(0);
          }
        }
      };
      
      window.addEventListener("storage", handleCartUpdate);
      // Also listen for custom event for same-tab updates
      window.addEventListener("guestCartUpdated", handleCartUpdate);
      
      return () => {
        window.removeEventListener("storage", handleCartUpdate);
        window.removeEventListener("guestCartUpdated", handleCartUpdate);
      };
    }
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    router.push(`/products?${params.toString()}`);
  }

  async function handleLogout() {
    try {
      const token = await getUserTokenFromCookies();
      if (token) {
        await logout(token);
      }
      setIsAuthenticated(false);
      setCartCount(0);
      setCartTotal(0);
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
      // Even if logout fails, clear local state
      setIsAuthenticated(false);
      setCartCount(0);
      setCartTotal(0);
      router.push("/");
    }
  }

  return (
    <header className="bg-white border-b border-[#E5E5E5] relative z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 py-3 sm:py-0 sm:h-20">
          {/* Logo */}
          <div className="flex items-center shrink-0 w-full sm:w-auto justify-between sm:justify-start">
            <Link href="/" className="flex items-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-10 sm:h-12 object-contain"
                />
              ) : (
                <span className="text-2xl sm:text-3xl font-bold text-black">
                  {siteName}
                  <span className="text-[#FFC107]">.</span>
                </span>
              )}
            </Link>
            {/* Mobile Cart and Auth - shown on small screens */}
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
              {/* User Menu - Mobile */}
              {isAuthenticated ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="p-2 text-black hover:text-[#FFC107] transition-colors"
                    aria-label="User menu"
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E5E5E5] rounded-md shadow-lg z-[100]">
                      <div className="py-1">
                        <Link
                          href="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                        >
                          My Profile
                        </Link>
                        <Link
                          href="/orders"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                        >
                          My Orders
                        </Link>
                        <Link
                          href="/addresses"
                          onClick={() => setShowUserMenu(false)}
                          className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                        >
                          My Addresses
                        </Link>
                        <div className="border-t border-[#E5E5E5] my-1"></div>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="text-sm text-black hover:text-[#FFC107] transition-colors px-2"
                >
                  Login
                </Link>
              )}
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
                ৳{cartTotal.toFixed(2)}
              </span>
            )}

            {/* User Menu - Desktop */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-2 text-black hover:text-[#FFC107] transition-colors"
                  aria-label="User menu"
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#E5E5E5] rounded-md shadow-lg z-[100]">
                    <div className="py-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                      >
                        My Profile
                      </Link>
                      <Link
                        href="/orders"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                      >
                        My Orders
                      </Link>
                      <Link
                        href="/addresses"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                      >
                        My Addresses
                      </Link>
                      <div className="border-t border-[#E5E5E5] my-1"></div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-black hover:bg-[#F5F5F5] transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
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
