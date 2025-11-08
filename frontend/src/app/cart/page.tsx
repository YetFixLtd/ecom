"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/utils/images";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import {
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "@/lib/apis/client/cart";
import { getUserTokenFromCookies } from "@/lib/cookies";
import type { Cart, CartItem } from "@/types/client";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    loadCart();
  }, []);

  async function loadCart() {
    const token = await getUserTokenFromCookies();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await getCart(token);
      setCart(response.data);
    } catch (error) {
      console.error("Error loading cart:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateQuantity(item: CartItem, newQuantity: number) {
    if (newQuantity < 1) return;

    const token = await getUserTokenFromCookies();
    if (!token) return;

    setUpdating(item.id);
    try {
      await updateCartItem(token, item.id, { quantity: newQuantity });
      await loadCart();
    } catch (error) {
      alert("Failed to update cart item");
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemoveItem(itemId: number) {
    const token = await getUserTokenFromCookies();
    if (!token) return;

    if (!confirm("Remove this item from cart?")) return;

    try {
      await removeCartItem(token, itemId);
      await loadCart();
    } catch (error) {
      alert("Failed to remove item");
    }
  }

  async function handleClearCart() {
    const token = await getUserTokenFromCookies();
    if (!token) return;

    if (!confirm("Clear entire cart?")) return;

    try {
      await clearCart(token);
      await loadCart();
    } catch (error) {
      alert("Failed to clear cart");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading cart...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-8">
              Shopping Cart
            </h1>
            <div className="text-center py-12">
              <p className="text-zinc-500 text-lg mb-4">Your cart is empty</p>
              <Link
                href="/products"
                className="inline-block bg-zinc-900 text-white px-6 py-3 rounded-md hover:bg-zinc-800 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-zinc-900">Shopping Cart</h1>
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Clear Cart
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 divide-y divide-zinc-200">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-6 flex gap-4">
                    {item.variant?.product?.primary_image && (
                      <div className="relative w-24 h-24 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                        <Image
                          src={getImageUrl(
                            item.variant.product.primary_image.url
                          )}
                          alt={
                            item.variant.product.primary_image.alt_text || ""
                          }
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-zinc-900 mb-1">
                        {item.variant?.product?.name || "Product"}
                      </h3>
                      <p className="text-sm text-zinc-500 mb-2">
                        SKU: {item.variant?.sku || "N/A"}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity - 1)
                            }
                            disabled={
                              updating === item.id || item.quantity <= 1
                            }
                            className="w-8 h-8 border border-zinc-300 rounded flex items-center justify-center disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="w-12 text-center">
                            {updating === item.id ? "..." : item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item, item.quantity + 1)
                            }
                            disabled={updating === item.id}
                            className="w-8 h-8 border border-zinc-300 rounded flex items-center justify-center disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-zinc-900">
                            ${item.line_total.toFixed(2)}
                          </p>
                          <p className="text-sm text-zinc-500">
                            ${item.unit_price.toFixed(2)} each
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 ml-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 sticky top-8">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">
                  Order Summary
                </h2>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-zinc-700">
                    <span>Subtotal</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-700">
                    <span>Items</span>
                    <span>{cart.items_count}</span>
                  </div>
                </div>
                <div className="border-t border-zinc-200 pt-4 mb-4">
                  <div className="flex justify-between text-lg font-bold text-zinc-900">
                    <span>Total</span>
                    <span>${cart.subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  className="block w-full bg-zinc-900 text-white text-center px-6 py-3 rounded-md hover:bg-zinc-800 transition-colors"
                >
                  Proceed to Checkout
                </Link>
                <Link
                  href="/products"
                  className="block w-full text-center mt-4 text-zinc-600 hover:text-zinc-900"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
