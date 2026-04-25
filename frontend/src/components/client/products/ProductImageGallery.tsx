"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/utils/images";

type GalleryImage = {
  url: string;
  alt_text: string | null;
};

interface Props {
  images: GalleryImage[];
  fallback: GalleryImage | null;
  productName: string;
  topLeftBadge?: React.ReactNode;
  topRightBadge?: React.ReactNode;
}

export default function ProductImageGallery({
  images,
  fallback,
  productName,
  topLeftBadge,
  topRightBadge,
}: Props) {
  const [index, setIndex] = useState(0);
  const list = images.length > 0 ? images : fallback ? [fallback] : [];
  const current = list[index] || fallback;
  const hasMultiple = list.length > 1;

  const prev = () => setIndex((i) => (i - 1 + list.length) % list.length);
  const next = () => setIndex((i) => (i + 1) % list.length);

  return (
    <div className="lg:sticky lg:top-24 lg:self-start">
      <div className="group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        {current && (
          <Image
            src={getImageUrl(current.url)}
            alt={current.alt_text || productName}
            fill
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        )}

        {topLeftBadge && (
          <div className="absolute left-4 top-4 z-10">{topLeftBadge}</div>
        )}
        {topRightBadge && (
          <div className="absolute right-4 top-4 z-10">{topRightBadge}</div>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-zinc-700 shadow-md opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-zinc-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-zinc-700 shadow-md opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-zinc-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6">
          {list.map((image, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-xl bg-white ring-2 transition ${
                i === index
                  ? "ring-zinc-900 opacity-100"
                  : "ring-zinc-200 opacity-70 hover:opacity-100 hover:ring-zinc-400"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={getImageUrl(image.url)}
                alt={image.alt_text || productName}
                fill
                className="object-contain p-1"
                sizes="(max-width: 1024px) 20vw, 10vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
