"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import { getCart } from "@/lib/apis/client/cart";
import { getAddresses, createAddress } from "@/lib/apis/client/addresses";
import { createOrder } from "@/lib/apis/client/orders";
import { getUserTokenFromCookies } from "@/lib/cookies";
import type { Cart, Address, CreateAddressRequest } from "@/types/client";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null);
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(
    null
  );
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<CreateAddressRequest>({
    name: "",
    line1: "",
    city: "",
    country_code: "US",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const token = await getUserTokenFromCookies();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const [cartResponse, addressesResponse] = await Promise.all([
        getCart(token),
        getAddresses(token),
      ]);
      setCart(cartResponse.data);
      setAddresses(addressesResponse.data);

      // Set default addresses
      const defaultBilling = addressesResponse.data.find(
        (a) => a.is_default_billing
      );
      const defaultShipping = addressesResponse.data.find(
        (a) => a.is_default_shipping
      );
      if (defaultBilling) setBillingAddressId(defaultBilling.id);
      if (defaultShipping) setShippingAddressId(defaultShipping.id);
    } catch (error) {
      console.error("Error loading checkout data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateAddress() {
    const token = await getUserTokenFromCookies();
    if (!token) return;

    try {
      const response = await createAddress(token, newAddress);
      setAddresses([...addresses, response.data]);
      setBillingAddressId(response.data.id);
      setShippingAddressId(response.data.id);
      setShowNewAddress(false);
      setNewAddress({
        name: "",
        line1: "",
        city: "",
        country_code: "US",
      });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create address");
    }
  }

  async function handleSubmitOrder() {
    if (!billingAddressId || !shippingAddressId) {
      alert("Please select billing and shipping addresses");
      return;
    }

    const token = await getUserTokenFromCookies();
    if (!token) return;

    setSubmitting(true);
    try {
      const response = await createOrder(token, {
        billing_address_id: billingAddressId,
        shipping_address_id: shippingAddressId,
        shipping_method_id: shippingMethodId || undefined,
      });
      router.push(`/orders/${response.data.id}`);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading...</p>
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
            <p className="text-zinc-500">Your cart is empty</p>
            <Link href="/products" className="text-blue-600 hover:underline">
              Continue Shopping
            </Link>
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
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Billing Address */}
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">
                  Billing Address
                </h2>
                {addresses.length > 0 ? (
                  <select
                    value={billingAddressId || ""}
                    onChange={(e) =>
                      setBillingAddressId(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md mb-4"
                  >
                    <option value="">Select billing address</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name} - {addr.full_address}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-zinc-500 mb-4">No addresses found</p>
                )}
                <button
                  onClick={() => setShowNewAddress(!showNewAddress)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  {showNewAddress ? "Cancel" : "+ Add New Address"}
                </button>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                <h2 className="text-xl font-bold text-zinc-900 mb-4">
                  Shipping Address
                </h2>
                {addresses.length > 0 ? (
                  <select
                    value={shippingAddressId || ""}
                    onChange={(e) =>
                      setShippingAddressId(parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                  >
                    <option value="">Select shipping address</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.name} - {addr.full_address}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-zinc-500">No addresses found</p>
                )}
              </div>

              {/* New Address Form */}
              {showNewAddress && (
                <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                  <h3 className="text-lg font-semibold text-zinc-900 mb-4">
                    New Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newAddress.name}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={newAddress.line1}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            line1: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        City
                      </label>
                      <input
                        type="text"
                        value={newAddress.city}
                        onChange={(e) =>
                          setNewAddress({ ...newAddress, city: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">
                        Country Code
                      </label>
                      <input
                        type="text"
                        value={newAddress.country_code}
                        onChange={(e) =>
                          setNewAddress({
                            ...newAddress,
                            country_code: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                        required
                      />
                    </div>
                    <button
                      onClick={handleCreateAddress}
                      className="bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800"
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                <Link
                  href="/addresses"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Manage Addresses →
                </Link>
              </div>
            </div>

            {/* Order Summary */}
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
                <div className="border-t border-zinc-200 pt-4 mb-4">
                  <div className="flex justify-between text-lg font-bold text-zinc-900">
                    <span>Total</span>
                    <span>৳{cart.subtotal.toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  disabled={
                    submitting || !billingAddressId || !shippingAddressId
                  }
                  className="w-full bg-zinc-900 text-white px-6 py-3 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Processing..." : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
