"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils/images";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import { getProduct, getProductVariants } from "@/lib/apis/client/products";
import { addToCart } from "@/lib/apis/client/cart";
import { getUserTokenFromCookies } from "@/lib/cookies";
import type { ClientProduct, ProductVariant } from "@/types/client";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = parseInt(params.id as string);
  const [product, setProduct] = useState<ClientProduct | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    null
  );
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    loadProduct();
    loadVariants();
  }, [productId]);

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
      }
    } catch (error) {
      console.error("Error loading variants:", error);
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant) return;

    const token = await getUserTokenFromCookies();
    
    setAddingToCart(true);
    try {
      if (token) {
        // Authenticated user - use API
        await addToCart(token, {
          variant_id: selectedVariant.id,
          quantity,
        });
        alert("Product added to cart!");
        router.push("/cart");
      } else {
        // Guest user - use localStorage
        const { addToGuestCart } = await import("@/lib/utils/guestCart");
        addToGuestCart(
          selectedVariant.id,
          quantity,
          selectedVariant.price,
          {
            id: selectedVariant.id,
            sku: selectedVariant.sku,
            price: selectedVariant.price,
            product: {
              id: product.id,
              name: product.name,
              slug: product.slug,
              primary_image: product.primary_image,
            },
          }
        );
        alert("Product added to cart!");
        router.push("/cart");
      }
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading product...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Product not found</p>
        </main>
        <Footer />
      </div>
    );
  }

  const images = product.images || [];
  const displayImage = images[selectedImageIndex] || product.primary_image;
  const price = selectedVariant?.price || product.min_price || 0;
  const comparePrice = selectedVariant?.compare_at_price;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <div>
              <div className="aspect-square relative bg-zinc-100 rounded-lg overflow-hidden mb-4">
                {displayImage && (
                  <Image
                    src={getImageUrl(displayImage.url)}
                    alt={displayImage.alt_text || product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square relative rounded-lg overflow-hidden border-2 ${
                        selectedImageIndex === index
                          ? "border-zinc-900"
                          : "border-zinc-200"
                      }`}
                    >
                      <Image
                        src={getImageUrl(image.url)}
                        alt={image.alt_text || product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 12.5vw"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 mb-4">
                {product.name}
              </h1>

              {product.brand && (
                <p className="text-lg text-zinc-600 mb-4">
                  Brand: {product.brand.name}
                </p>
              )}

              {product.categories && product.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.categories.map((cat) => (
                    <span
                      key={cat.id}
                      className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-sm"
                    >
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-3xl font-bold text-zinc-900">
                    ৳{price.toFixed(2)}
                  </span>
                  {comparePrice && comparePrice > price && (
                    <span className="text-xl text-zinc-500 line-through">
                      ৳{comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {comparePrice && comparePrice > price && (
                  <span className="text-sm text-red-600">
                    Save ৳{(comparePrice - price).toFixed(2)}
                  </span>
                )}
              </div>

              {product.short_description && (
                <p className="text-zinc-700 mb-6">
                  {product.short_description}
                </p>
              )}

              {/* Variant Selection */}
              {variants.length > 1 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    Select Variant
                  </label>
                  <select
                    value={selectedVariant?.id || ""}
                    onChange={(e) => {
                      const variant = variants.find(
                        (v) => v.id === parseInt(e.target.value)
                      );
                      setSelectedVariant(variant || null);
                    }}
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                  >
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.sku} - ৳{variant.price.toFixed(2)}
                        {variant.attributes &&
                          variant.attributes.length > 0 &&
                          ` (${variant.attributes
                            .map((a) => a.value)
                            .join(", ")})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-4 mb-6">
                <label className="text-sm font-medium text-zinc-700">
                  Quantity:
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="w-20 px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                />
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || !selectedVariant}
                  className="flex-1 bg-zinc-900 text-white px-6 py-3 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </button>
              </div>

              {/* Inventory Info */}
              {selectedVariant?.inventory &&
                selectedVariant.inventory.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold text-zinc-900 mb-2">
                      Availability
                    </h3>
                    <div className="space-y-2">
                      {selectedVariant.inventory.map((inv, index) => (
                        <div key={index} className="text-sm text-zinc-700">
                          {inv.warehouse_name ||
                            `Warehouse ${inv.warehouse_id}`}
                          : {inv.available} available
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Product Description - Bottom of Page */}
          {product.description && (
            <div className="mt-12 pt-8 border-t border-zinc-200 w-full">
              <div className="w-full">
                <label className="mb-1 block text-sm font-medium text-zinc-900">
                  Description
                </label>
                <div
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700"
                  style={{
                    minHeight: "200px",
                  }}
                >
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                      #product-description-content table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 1rem 0;
                        border: 1px solid #d1d5db;
                      }
                      #product-description-content thead {
                        background-color: #f9fafb;
                      }
                      #product-description-content th {
                        padding: 0.75rem;
                        text-align: left;
                        font-weight: 600;
                        border: 1px solid #d1d5db;
                        background-color: #f3f4f6;
                      }
                      #product-description-content td {
                        padding: 0.75rem;
                        border: 1px solid #d1d5db;
                      }
                      #product-description-content tr:nth-child(even) {
                        background-color: #f9fafb;
                      }
                      #product-description-content tr:hover {
                        background-color: #f3f4f6;
                      }
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
                      #product-description-content h1 {
                        font-size: 2rem;
                      }
                      #product-description-content h2 {
                        font-size: 1.5rem;
                      }
                      #product-description-content h3 {
                        font-size: 1.25rem;
                      }
                      #product-description-content p {
                        margin-bottom: 1rem;
                        line-height: 1.75;
                        color: #374151;
                      }
                      #product-description-content ul, 
                      #product-description-content ol {
                        margin: 1rem 0;
                        padding-left: 2rem;
                      }
                      #product-description-content li {
                        margin: 0.5rem 0;
                        color: #374151;
                      }
                      #product-description-content a {
                        color: #2563eb;
                        text-decoration: underline;
                      }
                      #product-description-content a:hover {
                        color: #1d4ed8;
                      }
                      #product-description-content img {
                        max-width: 100%;
                        height: auto;
                        border-radius: 0.375rem;
                        margin: 1rem 0;
                      }
                      #product-description-content blockquote {
                        border-left: 4px solid #d1d5db;
                        padding-left: 1rem;
                        margin: 1rem 0;
                        font-style: italic;
                        color: #6b7280;
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
                        border-radius: 0.375rem;
                        overflow-x: auto;
                        margin: 1rem 0;
                      }
                      #product-description-content pre code {
                        background-color: transparent;
                        padding: 0;
                        color: inherit;
                      }
                      #product-description-content strong {
                        font-weight: 600;
                      }
                      #product-description-content em {
                        font-style: italic;
                      }
                    `,
                    }}
                  />
                  <div
                    id="product-description-content"
                    className="prose prose-sm max-w-none w-full"
                    style={{
                      color: "#374151",
                    }}
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
