"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils/images";
import { getPublicSettings } from "@/lib/apis/settings";
import type { ClientProduct } from "@/types/client";
import { getProducts } from "@/lib/apis/client/products";
import { Phone } from "lucide-react";

interface HeroCarouselProps {
  products: ClientProduct[];
}

async function getFeaturedProducts(): Promise<ClientProduct[]> {
  try {
    const response = await getProducts({ featured: true, per_page: 5 });
    return response.data;
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return [];
  }
}
export default function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const featuredProducts = await getFeaturedProducts();
        setProducts(featuredProducts);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      }
    };
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    async function loadPhoneNumber() {
      try {
        const response = await getPublicSettings();
        setPhoneNumber(response.data.call_for_price_phone || null);
      } catch (error) {
        console.error("Error loading phone number:", error);
      }
    }
    loadPhoneNumber();
  }, []);

  const handleCallClick = () => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };
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

  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="lg:ml-80">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center relative pl-4">
            {/* Left Side - Text Content with fade transition */}
            <div
              className={`space-y-8 transition-opacity duration-500 ${
                isTransitioning ? "opacity-0" : "opacity-100"
              }`}
              key={`content-${currentIndex}`}
            >
              <div>
                {currentProduct.brand && (
                  <p className="text-sm md:text-base text-gray-500 font-medium  uppercase tracking-wide">
                    {currentProduct.brand.name}
                  </p>
                )}
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-black tracking-tight leading-tight">
                  {currentProduct.name}
                </h1>
                {currentProduct.short_description && (
                  <p className="text-base md:text-lg text-gray-700 font-medium line-clamp-2 whitespace-pre-wrap break-words">
                    {currentProduct.short_description}
                  </p>
                )}
              </div>
              {currentProduct.call_for_price && phoneNumber ? (
                <div>
                  <button
                    onClick={handleCallClick}
                    className="group relative bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 md:h-6 md:w-6" />
                      <div className="flex flex-col items-start">
                        <span className="text-lg md:text-xl font-bold leading-tight">Call for Price</span>
                        <span className="text-base md:text-lg opacity-90 leading-tight">{phoneNumber}</span>
                      </div>
                    </div>
                  </button>
                </div>
              ) : !currentProduct.is_upcoming && !currentProduct.call_for_price ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-lg md:text-xl text-gray-600 font-medium">
                    {currentProduct.min_price &&
                    currentProduct.max_price &&
                    currentProduct.min_price !== currentProduct.max_price
                      ? "FROM"
                      : ""}
                  </span>
                  <span className="text-5xl md:text-6xl lg:text-7xl font-black text-black">
                    {priceMain}
                  </span>

                  <span className="text-xl md:text-2xl lg:text-3xl font-black text-black">
                    ৳
                  </span>
                </div>
              ) : null}
              <Link
                href={`/products/${currentProduct.id}`}
                className="inline-block bg-[#FFC107] text-black font-bold text-sm px-16 py-2 rounded-md hover:bg-[#FFD700] transition-colors shadow-md"
              >
                Shop Now
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

            {/* Carousel Controls */}
            {products.length > 1 && (
              <div className="flex gap-3 mt-8">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
