import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/images";
import type { ClientProduct } from "@/types/client";

interface ProductCardProps {
  product: ClientProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl =
    getImageUrl(product.primary_image?.url) || "/placeholder-product.jpg";
  const priceDisplay =
    product.min_price === product.max_price
      ? `৳${product.min_price?.toFixed(2)}`
      : `৳${product.min_price?.toFixed(2)} - ৳${product.max_price?.toFixed(2)}`;

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
          <span className="text-lg font-bold text-zinc-900">
            {priceDisplay}
          </span>
          {product.min_price && product.max_price && (
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
