"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/images";
import { getPublicSettings } from "@/lib/apis/settings";
import type { ClientProduct } from "@/types/client";
import { Phone } from "lucide-react";

interface ProductCardProps {
  product: ClientProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    async function loadPhoneNumber() {
      try {
        const response = await getPublicSettings();
        setPhoneNumber(response.data.call_for_price_phone || null);
      } catch (error) {
        console.error("Error loading phone number:", error);
      }
    }
    if (product.call_for_price) {
      loadPhoneNumber();
    }
  }, [product.call_for_price]);

  const imageUrl =
    getImageUrl(product.primary_image?.url) || "/placeholder-product.jpg";
  const priceDisplay =
    product.min_price === product.max_price
      ? `৳${product.min_price?.toFixed(2)}`
      : `৳${product.min_price?.toFixed(2)} - ৳${product.max_price?.toFixed(2)}`;

  const handleCallClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group bg-white rounded-lg shadow-sm border border-zinc-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="aspect-square relative bg-zinc-100">
        <Image
          src={imageUrl}
          alt={product.primary_image?.alt_text || product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {product.call_for_price && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-md">
              Call for Price
            </span>
          )}
          {product.is_upcoming && (
            <span className="bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded shadow-md">
              Upcoming
            </span>
          )}
          {product.is_featured && (
            <span className="bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-zinc-900 mb-1 line-clamp-2 group-hover:text-zinc-600 transition-colors">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-sm text-zinc-500 mb-2">{product.brand.name}</p>
        )}
        {product.short_description && (
          <p className="text-sm text-zinc-600 mb-3 line-clamp-2 whitespace-pre-wrap break-words">
            {product.short_description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {product.call_for_price && phoneNumber ? (
            <button
              onClick={handleCallClick}
              className="group relative bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5" />
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold leading-tight">Call for Price</span>
                  <span className="text-xs opacity-90 leading-tight">{phoneNumber}</span>
                </div>
              </div>
            </button>
          ) : !product.is_upcoming && !product.call_for_price ? (
            <span className="text-lg font-bold text-zinc-900">
              {priceDisplay}
            </span>
          ) : null}
          {product.min_price && product.max_price && !product.is_upcoming && !product.call_for_price && (
            <span className="text-sm text-zinc-500">
              {product.variants?.length || 0} variant
              {(product.variants?.length || 0) !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
