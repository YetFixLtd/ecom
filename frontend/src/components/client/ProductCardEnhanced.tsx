"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/utils/images";
import { addToCart } from "@/lib/apis/client/cart";
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

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    // Get first available variant
    const variant = product.variants?.[0];
    if (!variant) return;

    const token = await getUserTokenFromCookies();

    setAddingToCart(true);
    try {
      if (token) {
        // Authenticated user - use API
        await addToCart(token, {
          variant_id: variant.id,
          quantity: 1,
        });
      } else {
        // Guest user - use localStorage
        const { addToGuestCart } = await import("@/lib/utils/guestCart");
        addToGuestCart(
          variant.id,
          1,
          variant.price,
          {
            id: variant.id,
            sku: variant.sku,
            price: variant.price,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              primary_image: product.primary_image,
            },
          }
        );
      }
      // Optionally show a toast notification here
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white border border-[#E5E5E5] rounded-lg overflow-hidden hover:shadow-md transition-shadow relative"
    >
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
      <div className="p-4">
        <h3 className="font-semibold text-black text-sm mb-2 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Price */}
        <div className="flex items-center justify-between mb-2">
          {comparePrice && comparePrice > price ? (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-[#DC2626]">
                ৳{price.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ৳{comparePrice.toFixed(2)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-black">
              ৳{price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Yellow Cart Icon Button */}
      <button
        onClick={handleAddToCart}
        disabled={addingToCart}
        className="absolute bottom-4 right-4 bg-[#FFC107] text-black p-2 rounded-full hover:bg-[#FFD700] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-10"
        aria-label="Add to cart"
      >
        {addingToCart ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
    </Link>
  );
}
