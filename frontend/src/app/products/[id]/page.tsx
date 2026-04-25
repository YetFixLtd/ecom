"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  ShoppingCart,
  Zap,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Clock,
  PackageX,
  PackageSearch,
} from "lucide-react";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import ProductImageGallery from "@/components/client/products/ProductImageGallery";
import ProductPriceBlock from "@/components/client/products/ProductPriceBlock";
import QuantityStepper from "@/components/client/products/QuantityStepper";
import TrustBadges from "@/components/client/products/TrustBadges";
import ProductDetailSkeleton from "@/components/client/products/ProductDetailSkeleton";
import {
  getProduct,
  getProductVariants,
  checkVariantAvailability,
} from "@/lib/apis/client/products";
import { addToCart } from "@/lib/apis/client/cart";
import { getUserTokenFromCookies } from "@/lib/cookies";
import { getPublicSettings } from "@/lib/apis/settings";
import type { ClientProduct, ProductVariant } from "@/types/client";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);
  const [product, setProduct] = useState<ClientProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [isStockout, setIsStockout] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState<number | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
    loadVariants();
  }, [productId]);

  useEffect(() => {
    async function loadPhoneNumber() {
      try {
        const response = await getPublicSettings();
        setPhoneNumber(response.data.call_for_price_phone || null);
      } catch (error) {
        console.error("Error loading phone number:", error);
      }
    }
    if (product?.call_for_price) {
      loadPhoneNumber();
    }
  }, [product?.call_for_price]);

  const handleCallClick = () => {
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  async function loadProduct() {
    try {
      const response = await getProduct(productId);
      setProduct(response.data);
      if (response.data.variants && response.data.variants.length > 0) {
        setSelectedVariant(response.data.variants[0]);
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadVariants() {
    try {
      const response = await getProductVariants(productId);
      setVariants(response.data);
      if (response.data.length > 0) {
        setSelectedVariant(response.data[0]);
        checkAvailability(response.data[0], 1);
      }
    } catch (error) {
      console.error("Error loading variants:", error);
    }
  }

  async function checkAvailability(variant: ProductVariant, qty: number) {
    if (!variant) return;
    setCheckingAvailability(true);
    try {
      const availability = await checkVariantAvailability(variant.id, qty);
      setIsStockout(!availability.available && availability.stockout === true);
      setAvailableQuantity(availability.available_quantity ?? null);
    } catch (error) {
      console.error("Error checking availability:", error);
    } finally {
      setCheckingAvailability(false);
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant) return;
    if (product?.is_upcoming) {
      alert("This is an upcoming product. Orders are not available at this time.");
      return;
    }
    try {
      const availability = await checkVariantAvailability(selectedVariant.id, quantity);
      if (!availability.available) {
        if (availability.stockout) {
          alert("Stockout - This item is currently out of stock.");
          setIsStockout(true);
        } else {
          alert("Insufficient stock available.");
        }
        return;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    }

    const token = await getUserTokenFromCookies();
    setAddingToCart(true);
    try {
      if (token) {
        await addToCart(token, { variant_id: selectedVariant.id, quantity });
        alert("Product added to cart!");
        router.push("/cart");
      } else {
        if (!product) return;
        const { addToGuestCart } = await import("@/lib/utils/guestCart");
        addToGuestCart(selectedVariant.id, quantity, selectedVariant.price, {
          id: selectedVariant.id,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            primary_image: product.primary_image,
          },
        });
        alert("Product added to cart!");
        router.push("/cart");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to add to cart";
      if (
        errorMessage.toLowerCase().includes("stock") ||
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not available")
      ) {
        setIsStockout(true);
      }
      alert(errorMessage);
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleBuyNow() {
    if (!selectedVariant) return;
    if (product?.is_upcoming) {
      alert("This is an upcoming product. Orders are not available at this time.");
      return;
    }
    try {
      const availability = await checkVariantAvailability(selectedVariant.id, quantity);
      if (!availability.available) {
        if (availability.stockout) {
          alert("Stockout - This item is currently out of stock.");
          setIsStockout(true);
        } else {
          alert("Insufficient stock available.");
        }
        return;
      }
    } catch (error) {
      console.error("Error checking availability:", error);
    }

    const token = await getUserTokenFromCookies();
    setBuyingNow(true);
    try {
      if (token) {
        await addToCart(token, { variant_id: selectedVariant.id, quantity });
        router.push("/cart");
      } else {
        if (!product) return;
        const { addToGuestCart } = await import("@/lib/utils/guestCart");
        addToGuestCart(selectedVariant.id, quantity, selectedVariant.price, {
          id: selectedVariant.id,
          sku: selectedVariant.sku,
          price: selectedVariant.price,
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            primary_image: product.primary_image,
          },
        });
        router.push("/cart");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to add to cart";
      if (
        errorMessage.toLowerCase().includes("stock") ||
        errorMessage.toLowerCase().includes("insufficient") ||
        errorMessage.toLowerCase().includes("not available")
      ) {
        setIsStockout(true);
      }
      alert(errorMessage);
    } finally {
      setBuyingNow(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <Header />
        <main className="flex-1">
          <ProductDetailSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-zinc-50">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <div className="max-w-md rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-100">
            <PackageSearch className="mx-auto h-12 w-12 text-zinc-400" />
            <h2 className="mt-4 text-xl font-bold text-zinc-900">Product not found</h2>
            <p className="mt-2 text-sm text-zinc-500">
              The product you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Browse Products
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images || [];
  const price = selectedVariant?.price || product.min_price || 0;
  const comparePrice = selectedVariant?.compare_at_price ?? null;
  const hasDiscount = comparePrice != null && comparePrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((comparePrice! - price) / comparePrice!) * 100)
    : 0;
  const primaryCategory = product.categories?.[0];
  const showPrice = !product.is_upcoming && !product.call_for_price && !isStockout;
  const actionsDisabled =
    addingToCart ||
    buyingNow ||
    !selectedVariant ||
    isStockout ||
    checkingAvailability ||
    !!product.is_upcoming ||
    !!product.call_for_price;

  const statusBadge = product.call_for_price ? (
    <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
      Call for Price
    </span>
  ) : product.is_upcoming ? (
    <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
      Upcoming
    </span>
  ) : product.is_featured ? (
    <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold uppercase tracking-wider text-yellow-900 shadow-md">
      Featured
    </span>
  ) : null;

  const discountBadge = hasDiscount && showPrice ? (
    <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
      -{discountPercent}%
    </span>
  ) : null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-900">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href="/products" className="hover:text-zinc-900">
              Products
            </Link>
            {primaryCategory && (
              <>
                <ChevronRight className="h-3.5 w-3.5" />
                <Link
                  href={`/products?category=${primaryCategory.slug}`}
                  className="hover:text-zinc-900"
                >
                  {primaryCategory.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate font-medium text-zinc-900">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Gallery */}
            <ProductImageGallery
              images={images}
              fallback={product.primary_image}
              productName={product.name}
              topLeftBadge={discountBadge}
              topRightBadge={statusBadge}
            />

            {/* Info */}
            <div>
              {product.brand && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  {product.brand.name}
                </p>
              )}

              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 lg:text-4xl">
                {product.name}
              </h1>

              {product.categories && product.categories.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/products?category=${cat.slug}`}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-200"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-6">
                {product.call_for_price && phoneNumber ? (
                  <button
                    onClick={handleCallClick}
                    className="group relative flex w-full items-center gap-4 rounded-2xl border-2 border-red-100 bg-white px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500 hover:shadow-lg hover:shadow-red-500/10"
                  >
                    <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 shadow-md shadow-red-500/30">
                      <span className="absolute inset-0 animate-ping rounded-full bg-red-400/40" />
                      <Phone className="relative h-5 w-5 text-white" />
                    </span>
                    <span className="flex flex-1 flex-col items-start text-left">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
                        Call for Price
                      </span>
                      <span className="text-2xl font-extrabold tracking-tight text-zinc-900">
                        {phoneNumber}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-red-500 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                ) : showPrice ? (
                  <ProductPriceBlock price={price} comparePrice={comparePrice} />
                ) : null}
              </div>

              {product.short_description && (
                <p className="mb-4 whitespace-pre-wrap break-words leading-relaxed text-zinc-600">
                  {product.short_description}
                </p>
              )}

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("product-description-section")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
              >
                More Details
                <ChevronDown className="h-4 w-4" />
              </button>

              {/* Variant selector */}
              {variants.length > 1 && (
                <div className="mb-6">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Select Variant
                  </label>
                  <div className="relative">
                    <select
                      value={selectedVariant?.id || ""}
                      onChange={(e) => {
                        const variant = variants.find(
                          (v) => v.id === parseInt(e.target.value)
                        );
                        setSelectedVariant(variant || null);
                        if (variant) {
                          checkAvailability(variant, quantity);
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-zinc-900 shadow-sm transition focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    >
                      {variants.map((variant) => (
                        <option key={variant.id} value={variant.id}>
                          {variant.sku}
                          {!product.is_upcoming &&
                            !product.call_for_price &&
                            ` - ৳${variant.price.toFixed(2)}`}
                          {variant.attributes &&
                            variant.attributes.length > 0 &&
                            ` (${variant.attributes.map((a) => a.value).join(", ")})`}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  </div>
                </div>
              )}

              {/* Status messages */}
              {product.call_for_price && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm font-medium text-red-800">
                    Please call for pricing. Add to Cart and Buy Now are not available
                    for this product.
                  </p>
                </div>
              )}
              {product.is_upcoming && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-600" />
                  <p className="text-sm font-medium text-orange-800">
                    This is an upcoming product. Orders are not available at this time.
                  </p>
                </div>
              )}
              {isStockout && !product.is_upcoming && !product.call_for_price && (
                <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                  <PackageX className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                  <p className="text-sm font-medium text-red-800">
                    Stockout — This item is currently out of stock.
                  </p>
                </div>
              )}
              {availableQuantity != null &&
                availableQuantity > 0 &&
                availableQuantity <= 5 &&
                !isStockout &&
                !product.is_upcoming &&
                !product.call_for_price && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">
                      Only {availableQuantity} left in stock — order soon.
                    </p>
                  </div>
                )}

              {/* Quantity + actions */}
              <div className="mb-6">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Quantity
                </label>
                <QuantityStepper
                  value={quantity}
                  max={availableQuantity}
                  disabled={!!product.call_for_price}
                  onChange={(n) => {
                    setQuantity(n);
                    if (selectedVariant) checkAvailability(selectedVariant, n);
                  }}
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={handleAddToCart}
                  disabled={actionsDisabled}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-900 bg-white px-6 py-4 text-base font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-900 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-zinc-900"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {addingToCart
                    ? "Adding..."
                    : checkingAvailability
                    ? "Checking..."
                    : product.call_for_price
                    ? "Call for Price"
                    : product.is_upcoming
                    ? "Upcoming"
                    : isStockout
                    ? "Out of Stock"
                    : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={actionsDisabled}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-red-500 to-red-600 px-6 py-4 text-base font-bold text-white shadow-md transition hover:from-red-600 hover:to-red-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap className="h-5 w-5" />
                  {buyingNow
                    ? "Processing..."
                    : checkingAvailability
                    ? "Checking..."
                    : product.call_for_price
                    ? "Call for Price"
                    : product.is_upcoming
                    ? "Upcoming"
                    : isStockout
                    ? "Out of Stock"
                    : "Buy Now"}
                </button>
              </div>

              <TrustBadges />
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div
              id="product-description-section"
              className="mt-12 scroll-mt-24 rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm lg:p-8"
            >
              <div className="mb-6 flex items-center gap-3">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                  Product Description
                </h2>
                <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-zinc-200 to-transparent" />
              </div>
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                    #product-description-content table {
                      width: 100%;
                      border-collapse: collapse;
                      margin: 1rem 0;
                      border: 1px solid #e5e7eb;
                      border-radius: 0.5rem;
                      overflow: hidden;
                    }
                    #product-description-content thead { background-color: #f9fafb; }
                    #product-description-content th {
                      padding: 0.75rem 1rem;
                      text-align: left;
                      font-weight: 600;
                      border: 1px solid #e5e7eb;
                      background-color: #f3f4f6;
                      color: #111827;
                    }
                    #product-description-content td {
                      padding: 0.75rem 1rem;
                      border: 1px solid #e5e7eb;
                    }
                    #product-description-content tr:nth-child(even) { background-color: #fafafa; }
                    #product-description-content tr:hover { background-color: #f3f4f6; }
                    #product-description-content h1,
                    #product-description-content h2,
                    #product-description-content h3,
                    #product-description-content h4,
                    #product-description-content h5,
                    #product-description-content h6 {
                      margin-top: 1.5rem;
                      margin-bottom: 0.75rem;
                      font-weight: 600;
                      line-height: 1.25;
                      color: #111827;
                    }
                    #product-description-content h1 { font-size: 1.875rem; }
                    #product-description-content h2 { font-size: 1.5rem; }
                    #product-description-content h3 { font-size: 1.25rem; }
                    #product-description-content p {
                      margin-bottom: 1rem;
                      line-height: 1.75;
                      color: #374151;
                    }
                    #product-description-content ul,
                    #product-description-content ol {
                      margin: 1rem 0;
                      padding-left: 1.75rem;
                    }
                    #product-description-content ul { list-style: disc; }
                    #product-description-content ol { list-style: decimal; }
                    #product-description-content li { margin: 0.4rem 0; color: #374151; }
                    #product-description-content a {
                      color: #2563eb;
                      text-decoration: underline;
                    }
                    #product-description-content a:hover { color: #1d4ed8; }
                    #product-description-content img {
                      max-width: 100%;
                      height: auto;
                      border-radius: 0.5rem;
                      margin: 1rem 0;
                    }
                    #product-description-content blockquote {
                      border-left: 4px solid #d4d4d8;
                      padding: 0.5rem 0 0.5rem 1rem;
                      margin: 1rem 0;
                      font-style: italic;
                      color: #6b7280;
                      background-color: #fafafa;
                      border-radius: 0 0.375rem 0.375rem 0;
                    }
                    #product-description-content code {
                      background-color: #f3f4f6;
                      padding: 0.125rem 0.375rem;
                      border-radius: 0.25rem;
                      font-size: 0.875em;
                      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
                    }
                    #product-description-content pre {
                      background-color: #1f2937;
                      color: #f9fafb;
                      padding: 1rem;
                      border-radius: 0.5rem;
                      overflow-x: auto;
                      margin: 1rem 0;
                    }
                    #product-description-content pre code {
                      background-color: transparent;
                      padding: 0;
                      color: inherit;
                    }
                    #product-description-content strong { font-weight: 600; color: #111827; }
                    #product-description-content em { font-style: italic; }
                  `,
                }}
              />
              <div
                id="product-description-content"
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
