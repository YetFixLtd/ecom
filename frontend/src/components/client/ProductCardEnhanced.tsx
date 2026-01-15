"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/utils/images";
import { addToCart } from "@/lib/apis/client/cart";
import { checkVariantAvailability } from "@/lib/apis/client/products";
import { getUserTokenFromCookies } from "@/lib/cookies";
import type { ClientProduct } from "@/types/client";

interface ProductCardEnhancedProps {
  product: ClientProduct;
}

export default function ProductCardEnhanced({
  product,
}: ProductCardEnhancedProps) {
  const router = useRouter();
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [isStockout, setIsStockout] = useState(false);

  const imageUrl = getImageUrl(
    product.primary_image?.url || product.images?.[0]?.url
  );
  const categoryName =
    product.categories && product.categories.length > 0
      ? product.categories[0].name
      : "Product";
  const price = product.min_price || 0;
  const comparePrice = product.variants?.find(
    (v) => v.compare_at_price && v.compare_at_price > v.price
  )?.compare_at_price;

  // Check stockout status on mount - only show stockout if ALL variants are out of stock
  useEffect(() => {
    const checkStockout = async () => {
      const variants = product.variants || [];
      if (variants.length === 0) return;

      // Check all variants to see if any are available
      try {
        const availabilityChecks = await Promise.allSettled(
          variants.map((variant) =>
            variant.id
              ? checkVariantAvailability(variant.id, 1)
              : Promise.resolve({ available: false, stockout: false })
          )
        );

        // Check if ALL variants are stockout
        const allStockout = availabilityChecks.every((result) => {
          if (result.status === "fulfilled") {
            return !result.value.available && result.value.stockout === true;
          }
          return false; // If check failed, don't assume stockout
        });

        // Only show stockout if ALL variants are out of stock
        setIsStockout(allStockout && variants.length > 0);
      } catch (error) {
        console.error("Error checking stockout status:", error);
        // Don't set stockout if check fails
      }
    };

    checkStockout();
  }, [product.variants]);

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Get first available variant
    const variant = product.variants?.[0];
    if (!variant) {
      alert("This product has no available variants.");
      return;
    }

    if (!variant.id) {
      alert("Invalid product variant.");
      return;
    }

    const token = await getUserTokenFromCookies();

    setAddingToCart(true);
    try {
      if (token) {
        // Authenticated user - use API
        const variantId = parseInt(String(variant.id), 10);
        if (isNaN(variantId) || variantId <= 0) {
          alert("Invalid product variant ID");
          setAddingToCart(false);
          return;
        }

        console.log("Adding to cart:", {
          variant_id: variantId,
          quantity: 1,
          variant,
        });
        await addToCart(token, {
          variant_id: variantId,
          quantity: 1,
        });
        // Dispatch event to update cart count
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else {
        // Guest user - check inventory first, then use localStorage
        try {
          const availability = await checkVariantAvailability(variant.id, 1);
          if (!availability.available) {
            if (availability.stockout) {
              alert("Stockout - This item is currently out of stock.");
              setIsStockout(true);
            } else {
              const message =
                availability.available_quantity !== undefined
                  ? `Only ${availability.available_quantity} item(s) available in stock.`
                  : availability.message;
              alert(message);
            }
            setAddingToCart(false);
            return;
          }
        } catch (error: unknown) {
          console.error("Error checking variant availability:", error);
          // Continue with adding to cart if availability check fails
        }

        const { addToGuestCart } = await import("@/lib/utils/guestCart");
        addToGuestCart(variant.id, 1, variant.price, {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            primary_image: product.primary_image,
          },
        });
      }
      // Optionally show a toast notification here
    } catch (error: unknown) {
      console.error("Add to cart error:", error);
      const errorMessage =
        (
          error as {
            response?: {
              data?: { message?: string; errors?: Record<string, string[]> };
            };
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to add to cart";

      // Check if it's a stockout error
      if (
        errorMessage.toLowerCase().includes("stock") ||
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not available")
      ) {
        setIsStockout(true);
      }

      const errors = (
        error as { response?: { data?: { errors?: Record<string, string[]> } } }
      )?.response?.data?.errors;
      if (errors) {
        const errorDetails = Object.values(errors).flat().join(", ");
        // Check if any error mentions stockout
        if (
          errorDetails.toLowerCase().includes("stock") ||
          errorDetails.toLowerCase().includes("insufficient") ||
          errorDetails.toLowerCase().includes("not available")
        ) {
          setIsStockout(true);
        }
        alert(`${errorMessage}: ${errorDetails}`);
      } else {
        alert(errorMessage);
      }
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleBuyNow(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Get first available variant
    const variant = product.variants?.[0];
    if (!variant) {
      alert("This product has no available variants.");
      return;
    }

    if (!variant.id) {
      alert("Invalid product variant.");
      return;
    }

    const token = await getUserTokenFromCookies();

    setBuyingNow(true);
    try {
      if (token) {
        // Authenticated user - use API
        const variantId = parseInt(String(variant.id), 10);
        if (isNaN(variantId) || variantId <= 0) {
          alert("Invalid product variant ID");
          setBuyingNow(false);
          return;
        }

        console.log("Buy now - Adding to cart:", {
          variant_id: variantId,
          quantity: 1,
          variant,
        });
        await addToCart(token, {
          variant_id: variantId,
          quantity: 1,
        });
        // Dispatch event to update cart count
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("cartUpdated"));
        }
      } else {
        // Guest user - check inventory first, then use localStorage
        try {
          const availability = await checkVariantAvailability(variant.id, 1);
          if (!availability.available) {
            if (availability.stockout) {
              alert("Stockout - This item is currently out of stock.");
              setIsStockout(true);
            } else {
              const message =
                availability.available_quantity !== undefined
                  ? `Only ${availability.available_quantity} item(s) available in stock.`
                  : availability.message;
              alert(message);
            }
            setBuyingNow(false);
            return;
          }
        } catch (error: unknown) {
          console.error("Error checking variant availability:", error);
          // Continue with adding to cart if availability check fails
        }

        const { addToGuestCart } = await import("@/lib/utils/guestCart");
        addToGuestCart(variant.id, 1, variant.price, {
          id: variant.id,
          sku: variant.sku,
          price: variant.price,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            primary_image: product.primary_image,
          },
        });
      }
      // Redirect to cart page
      router.push("/cart");
    } catch (error: unknown) {
      console.error("Buy now error:", error);
      const errorMessage =
        (
          error as {
            response?: {
              data?: { message?: string; errors?: Record<string, string[]> };
            };
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        "Failed to add to cart";

      // Check if it's a stockout error
      if (
        errorMessage.toLowerCase().includes("stock") ||
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not available")
      ) {
        setIsStockout(true);
      }

      const errors = (
        error as { response?: { data?: { errors?: Record<string, string[]> } } }
      )?.response?.data?.errors;
      if (errors) {
        const errorDetails = Object.values(errors).flat().join(", ");
        // Check if any error mentions stockout
        if (
          errorDetails.toLowerCase().includes("stock") ||
          errorDetails.toLowerCase().includes("insufficient") ||
          errorDetails.toLowerCase().includes("not available")
        ) {
          setIsStockout(true);
        }
        alert(`${errorMessage}: ${errorDetails}`);
      } else {
        alert(errorMessage);
      }
      setBuyingNow(false);
    }
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white border border-[#E5E5E5] rounded-lg overflow-hidden hover:shadow-md transition-shadow relative"
    >
      {/* Badges */}
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
        {product.is_upcoming && (
          <span className="bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            Upcoming
          </span>
        )}
        {product.is_featured && (
          <span className="bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            Featured
          </span>
        )}
        {isStockout && !product.is_upcoming && (
          <span className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
            Stockout
          </span>
        )}
      </div>

      {/* Category Label */}
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-white/90 backdrop-blur-sm text-xs font-medium text-black px-2 py-1 rounded">
          {categoryName}
        </span>
      </div>

      {/* Product Image */}
      <div className="aspect-square relative bg-[#F5F5F5]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 pb-16">
        <h3 className="font-semibold text-black text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex flex-col gap-1 mb-2 pr-20">
          {comparePrice && comparePrice > price ? (
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#DC2626]">
                  ৳{price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ৳{comparePrice.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-green-600 font-medium">
                Save ৳{(comparePrice - price).toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-black">
              ৳{price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 flex gap-2 z-10 flex-wrap justify-end max-w-[calc(100%-2rem)]">
        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          disabled={addingToCart || buyingNow || isStockout}
          className="bg-[#FFC107] text-black p-2 rounded-full hover:bg-[#FFD700] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Add to cart"
          title={isStockout ? "Out of stock" : "Add to cart"}
        >
          {addingToCart ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
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
          )}
        </button>

        {/* Buy Now Button */}
        <button
          onClick={handleBuyNow}
          disabled={addingToCart || buyingNow || isStockout}
          className="bg-[#DC2626] text-white px-3 sm:px-4 py-2 rounded-full hover:bg-[#B91C1C] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-semibold whitespace-nowrap flex-shrink-0"
          aria-label="Buy now"
          title={isStockout ? "Out of stock" : "Buy now"}
        >
          {buyingNow ? (
            <span className="flex items-center gap-1 sm:gap-2">
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="hidden sm:inline">Processing...</span>
            </span>
          ) : (
            "Buy Now"
          )}
        </button>
      </div>
    </Link>
  );
}
