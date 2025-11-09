"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils/images";
import type { ClientProduct } from "@/types/client";

interface HeroCarouselProps {
  products: ClientProduct[];
}

export default function HeroCarousel({ products }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (!isAutoPlaying || products.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
        setIsTransitioning(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, products.length]);

  if (products.length === 0) {
    return null;
  }

  const currentProduct = products[currentIndex];
  const price = currentProduct.min_price || 0;
  const priceMain = Math.floor(price);
  const priceDecimal = Math.round((price - priceMain) * 100);

  function goToSlide(index: number) {
    if (index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume after 10s
  }

  function nextSlide() {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
      setIsTransitioning(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }

  function prevSlide() {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
      setIsTransitioning(false);
    }, 300);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }

  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          {/* Left Side - Text Content with fade transition */}
          <div
            className={`space-y-8 transition-opacity duration-500 ${
              isTransitioning ? "opacity-0" : "opacity-100"
            }`}
            key={`content-${currentIndex}`}
          >
            <div>
              <h1 className="text-6xl md:text-7xl font-black text-black mb-3 tracking-tight leading-tight">
                THE NEW
                <br />
                STANDARD
              </h1>
              <p className="text-lg md:text-xl text-gray-700 font-medium tracking-wide">
                UNDER FAVORABLE{" "}
                {currentProduct.name?.toUpperCase() || "SMARTWATCHES"}
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg md:text-xl text-gray-600 font-medium">
                FROM
              </span>
              <span className="text-6xl md:text-7xl font-black text-black">
                {priceMain}
              </span>
              <span className="text-3xl md:text-4xl font-black text-black">
                {priceDecimal.toString().padStart(2, "0")}
              </span>
              <span className="text-2xl md:text-3xl font-black text-black">
                ৳
              </span>
            </div>
            <Link
              href={`/products/${currentProduct.id}`}
              className="inline-block bg-[#FFC107] text-black font-bold text-base px-10 py-4 rounded-md hover:bg-[#FFD700] transition-colors shadow-md"
            >
              Start Buying
            </Link>
          </div>

          {/* Right Side - Product Image with fade transition */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
            {products.map((product, index) => {
              const productImageUrl = getImageUrl(
                product.primary_image?.url || product.images?.[0]?.url
              );
              return (
                <div
                  key={product.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentIndex
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  {productImageUrl && (
                    <Image
                      src={productImageUrl}
                      alt={product.name}
                      fill
                      className="object-contain p-8"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority={index === 0}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Controls */}
        {products.length > 1 && (
          <>
            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-[#E5E5E5] rounded-full p-3 transition-all z-20 shadow-lg hover:shadow-xl"
              aria-label="Previous slide"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white border border-[#E5E5E5] rounded-full p-3 transition-all z-20 shadow-lg hover:shadow-xl"
              aria-label="Next slide"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Carousel Indicators */}
            <div className="flex justify-center gap-3 mt-8">
              {products.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "bg-[#FFC107] w-8"
                      : "bg-gray-300 hover:bg-gray-400 w-2"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
