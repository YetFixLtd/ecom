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
import {
  getGuestCart,
  updateGuestCartItem,
  removeGuestCartItem,
  clearGuestCart,
  getGuestCartForCheckout,
} from "@/lib/utils/guestCart";
import type { Cart, CartItem } from "@/types/client";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<
    "inside" | "outside" | null
  >(null);

  useEffect(() => {
    loadCart();
    // Load saved shipping selection from localStorage
    const savedShipping = localStorage.getItem("selectedShipping");
    if (savedShipping === "inside" || savedShipping === "outside") {
      setSelectedShipping(savedShipping);
    }
  }, []);

  // Save shipping selection to localStorage whenever it changes
  useEffect(() => {
    if (selectedShipping) {
      localStorage.setItem("selectedShipping", selectedShipping);
    }
  }, [selectedShipping]);

  function notifyCartUpdate() {
    // Dispatch event to update header cart count
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("guestCartUpdated"));
    }
  }

  async function loadCart() {
    const token = await getUserTokenFromCookies();
    if (!token) {
      // Guest user - load from localStorage
      setIsGuest(true);
      try {
        const guestCart = getGuestCartForCheckout();
        if (guestCart.items.length > 0) {
          setCart(guestCart);
        } else {
          setCart(null);
        }
      } catch (error) {
        console.error("Error loading guest cart:", error);
        setCart(null);
      }
      setLoading(false);
      return;
    }

    setIsGuest(false);
    try {
      const response = await getCart(token);
      setCart(response.data);
    } catch (error) {
      console.error("Error loading cart:", error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateQuantity(item: CartItem, newQuantity: number) {
    if (newQuantity < 1) return;

    const token = await getUserTokenFromCookies();

    setUpdating(item.id);
    try {
      if (token && !isGuest) {
        await updateCartItem(token, item.id, { quantity: newQuantity });
      } else {
        // Guest cart - find item by variant_id and update
        const guestCart = getGuestCart();
        const guestItem = guestCart.items.find(
          (gi) => gi.variant_id === item.variant_id
        );
        if (guestItem) {
          updateGuestCartItem(guestItem.id, newQuantity);
          notifyCartUpdate();
        }
      }
      await loadCart();
    } catch (error) {
      alert("Failed to update cart item");
    } finally {
      setUpdating(null);
    }
  }

  async function handleRemoveItem(itemId: number | string) {
    const token = await getUserTokenFromCookies();

    if (!confirm("Remove this item from cart?")) return;

    try {
      if (token && !isGuest) {
        await removeCartItem(token, itemId as number);
      } else {
        // Guest cart - remove by item ID
        removeGuestCartItem(itemId as string);
        notifyCartUpdate();
      }
      await loadCart();
    } catch (error) {
      alert("Failed to remove item");
    }
  }

  async function handleClearCart() {
    const token = await getUserTokenFromCookies();

    if (!confirm("Clear entire cart?")) return;

    try {
      if (token && !isGuest) {
        await clearCart(token);
      } else {
        clearGuestCart();
        notifyCartUpdate();
      }
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
                {cart.items.map((item, index) => (
                  <div
                    key={
                      isGuest ? `guest_${index}_${item.variant_id}` : item.id
                    }
                    className="p-6 flex gap-4"
                  >
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
                            ৳{item.line_total.toFixed(2)}
                          </p>
                          <p className="text-sm text-zinc-500">
                            ৳{item.unit_price.toFixed(2)} each
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveItem(
                              isGuest
                                ? (item as any).guestItemId || item.id
                                : item.id
                            )
                          }
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
                    <span>৳{cart.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-700">
                    <span>Items</span>
                    <span>{cart.items_count}</span>
                  </div>
                </div>

                {/* Shipping Options */}
                <div className="border-t border-zinc-200 pt-4 mb-4">
                  <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                    Shipping
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 border border-zinc-300 rounded-md cursor-pointer hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value="inside"
                          checked={selectedShipping === "inside"}
                          onChange={(e) => setSelectedShipping("inside")}
                          className="w-4 h-4 text-zinc-900"
                        />
                        <span className="text-sm text-zinc-700">
                          ঢাকার ভেতরে:
                        </span>
                      </div>
                      <span className="text-sm font-medium text-zinc-900">
                        ৳ 60
                      </span>
                    </label>
                    <label className="flex items-center justify-between p-3 border border-zinc-300 rounded-md cursor-pointer hover:bg-zinc-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="shipping"
                          value="outside"
                          checked={selectedShipping === "outside"}
                          onChange={(e) => setSelectedShipping("outside")}
                          className="w-4 h-4 text-zinc-900"
                        />
                        <span className="text-sm text-zinc-700">
                          ঢাকার বাহিরে:
                        </span>
                      </div>
                      <span className="text-sm font-medium text-zinc-900">
                        ৳ 110
                      </span>
                    </label>
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-4 mb-4">
                  <div className="flex justify-between text-lg font-bold text-zinc-900">
                    <span>Total</span>
                    <span>
                      ৳
                      {(
                        cart.subtotal +
                        (selectedShipping === "inside"
                          ? 60
                          : selectedShipping === "outside"
                          ? 110
                          : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  {selectedShipping && (
                    <div className="text-xs text-zinc-500 mt-1">
                      Subtotal: ৳{cart.subtotal.toFixed(2)} + Shipping: ৳
                      {selectedShipping === "inside" ? "60" : "110"}
                    </div>
                  )}
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
