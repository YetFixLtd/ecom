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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
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
    if (!token) {
      router.push("/login");
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(token, {
        variant_id: selectedVariant.id,
        quantity,
      });
      alert("Product added to cart!");
      router.push("/cart");
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
                    ${price.toFixed(2)}
                  </span>
                  {comparePrice && comparePrice > price && (
                    <span className="text-xl text-zinc-500 line-through">
                      ${comparePrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {comparePrice && comparePrice > price && (
                  <span className="text-sm text-red-600">
                    Save ${(comparePrice - price).toFixed(2)}
                  </span>
                )}
              </div>

              {product.short_description && (
                <p className="text-zinc-700 mb-6">{product.short_description}</p>
              )}

              {product.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-zinc-900 mb-2">
                    Description
                  </h3>
                  <div
                    className="text-zinc-700 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                </div>
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
                        {variant.sku} - ${variant.price.toFixed(2)}
                        {variant.attributes &&
                          variant.attributes.length > 0 &&
                          ` (${variant.attributes.map((a) => a.value).join(", ")})`}
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
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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
              {selectedVariant?.inventory && selectedVariant.inventory.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-zinc-900 mb-2">
                    Availability
                  </h3>
                  <div className="space-y-2">
                    {selectedVariant.inventory.map((inv, index) => (
                      <div key={index} className="text-sm text-zinc-700">
                        {inv.warehouse_name || `Warehouse ${inv.warehouse_id}`}:{" "}
                        {inv.available} available
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

