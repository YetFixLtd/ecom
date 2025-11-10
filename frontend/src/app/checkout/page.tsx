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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  
  // Address selection (for authenticated users)
  const [billingAddressId, setBillingAddressId] = useState<number | null>(null);
  const [shippingAddressId, setShippingAddressId] = useState<number | null>(null);
  
  // Direct address entry (for guests)
  const [billingAddress, setBillingAddress] = useState<CreateAddressRequest>({
    name: "",
    contact_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state_region: "",
    postal_code: "",
    country_code: "BD",
  });
  const [shippingAddress, setShippingAddress] = useState<CreateAddressRequest>({
    name: "",
    contact_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state_region: "",
    postal_code: "",
    country_code: "BD",
  });
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<CreateAddressRequest>({
    name: "",
    line1: "",
    city: "",
    country_code: "BD",
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (useSameAddress && isGuest) {
      setShippingAddress(billingAddress);
    }
  }, [useSameAddress, billingAddress, isGuest]);

  async function loadData() {
    const token = await getUserTokenFromCookies();
    
    if (!token) {
      // Guest checkout - try to load cart from localStorage
      setIsGuest(true);
      setIsAuthenticated(false);
      
      try {
        const guestCartStr = localStorage.getItem('guest_cart');
        if (guestCartStr) {
          const guestCart = JSON.parse(guestCartStr);
          // Convert localStorage cart to Cart format
          const items = guestCart.items || [];
          const subtotal = items.reduce((sum: number, item: any) => 
            sum + (item.unit_price * item.quantity), 0
          );
          setCart({
            id: 0,
            currency: guestCart.currency || 'BDT',
            status: 'open',
            items: items.map((item: any) => ({
              id: item.id || 0,
              variant_id: item.variant_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_total: item.unit_price * item.quantity,
              variant: item.variant,
            })),
            subtotal,
            items_count: items.length,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Error loading guest cart:", error);
      }
      
      setLoading(false);
      return;
    }

    setIsAuthenticated(true);
    setIsGuest(false);

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
        country_code: "BD",
      });
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to create address");
    }
  }

  function validateGuestAddresses(): boolean {
    if (!billingAddress.name || !billingAddress.line1 || !billingAddress.city) {
      alert("Please fill in all required billing address fields");
      return false;
    }
    if (!useSameAddress) {
      if (!shippingAddress.name || !shippingAddress.line1 || !shippingAddress.city) {
        alert("Please fill in all required shipping address fields");
        return false;
      }
    }
    if (!guestEmail || !guestName) {
      alert("Please provide your name and email");
      return false;
    }
    return true;
  }

  async function handleSubmitOrder() {
    const token = await getUserTokenFromCookies();

    if (isGuest) {
      // Guest checkout
      if (!validateGuestAddresses()) {
        return;
      }

      if (!cart || cart.items.length === 0) {
        alert("Your cart is empty");
        return;
      }

      setSubmitting(true);
      try {
        // Prepare cart items for guest order
        const cartItems = cart.items.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }));

        const orderData = {
          billing_address: billingAddress,
          shipping_address: useSameAddress ? billingAddress : shippingAddress,
          shipping_method_id: shippingMethodId || undefined,
          guest_email: guestEmail,
          guest_name: guestName,
          cart_items: cartItems,
          currency: cart.currency || 'BDT',
        };
        const response = await createOrder(orderData);
        
        // Clear guest cart after successful order
        localStorage.removeItem('guest_cart');
        
        router.push(`/orders/${response.data.id}`);
      } catch (error: any) {
        alert(error.response?.data?.message || "Failed to create order");
      } finally {
        setSubmitting(false);
      }
    } else {
      // Authenticated checkout
      if (!billingAddressId || !shippingAddressId) {
        alert("Please select billing and shipping addresses");
        return;
      }

      if (!token) return;

      setSubmitting(true);
      try {
        const response = await createOrder(
          {
            billing_address_id: billingAddressId,
            shipping_address_id: shippingAddressId,
            shipping_method_id: shippingMethodId || undefined,
          },
          token
        );
        router.push(`/orders/${response.data.id}`);
      } catch (error: any) {
        alert(error.response?.data?.message || "Failed to create order");
      } finally {
        setSubmitting(false);
      }
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

          {isGuest && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-800">
                You are checking out as a guest.{" "}
                <Link href="/login" className="underline font-medium">
                  Login
                </Link>{" "}
                or{" "}
                <Link href="/register" className="underline font-medium">
                  Sign up
                </Link>{" "}
                to save your information for faster checkout next time.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {isGuest ? (
                <>
                  {/* Guest Information */}
                  <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">
                      Contact Information
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Guest Billing Address */}
                  <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">
                      Billing Address
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={billingAddress.name}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Contact Name
                        </label>
                        <input
                          type="text"
                          value={billingAddress.contact_name || ""}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              contact_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={billingAddress.phone || ""}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              phone: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Address Line 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={billingAddress.line1}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              line1: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          value={billingAddress.line2 || ""}
                          onChange={(e) =>
                            setBillingAddress({
                              ...billingAddress,
                              line2: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={billingAddress.city}
                            onChange={(e) =>
                              setBillingAddress({
                                ...billingAddress,
                                city: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            State/Region
                          </label>
                          <input
                            type="text"
                            value={billingAddress.state_region || ""}
                            onChange={(e) =>
                              setBillingAddress({
                                ...billingAddress,
                                state_region: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={billingAddress.postal_code || ""}
                            onChange={(e) =>
                              setBillingAddress({
                                ...billingAddress,
                                postal_code: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Country Code <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={billingAddress.country_code}
                            onChange={(e) =>
                              setBillingAddress({
                                ...billingAddress,
                                country_code: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guest Shipping Address */}
                  <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-zinc-900">
                        Shipping Address
                      </h2>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={useSameAddress}
                          onChange={(e) => setUseSameAddress(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className="text-sm text-zinc-700">
                          Same as billing address
                        </span>
                      </label>
                    </div>
                    {!useSameAddress && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.name}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.contact_name || ""}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                contact_name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={shippingAddress.phone || ""}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Address Line 1 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.line1}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                line1: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Address Line 2
                          </label>
                          <input
                            type="text"
                            value={shippingAddress.line2 || ""}
                            onChange={(e) =>
                              setShippingAddress({
                                ...shippingAddress,
                                line2: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                              City <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.city}
                              onChange={(e) =>
                                setShippingAddress({
                                  ...shippingAddress,
                                  city: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                              State/Region
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.state_region || ""}
                              onChange={(e) =>
                                setShippingAddress({
                                  ...shippingAddress,
                                  state_region: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                              Postal Code
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.postal_code || ""}
                              onChange={(e) =>
                                setShippingAddress({
                                  ...shippingAddress,
                                  postal_code: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                              Country Code <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={shippingAddress.country_code}
                              onChange={(e) =>
                                setShippingAddress({
                                  ...shippingAddress,
                                  country_code: e.target.value,
                                })
                              }
                              className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {useSameAddress && (
                      <p className="text-zinc-500 text-sm">
                        Shipping address will be the same as billing address.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Authenticated User Address Selection */}
                  <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">
                      Billing Address
                    </h2>
                    {addresses.length > 0 ? (
                      <select
                        value={billingAddressId || ""}
                        onChange={(e) =>
                          setBillingAddressId(
                            e.target.value ? parseInt(e.target.value) : null
                          )
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

                  <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6">
                    <h2 className="text-xl font-bold text-zinc-900 mb-4">
                      Shipping Address
                    </h2>
                    {addresses.length > 0 ? (
                      <select
                        value={shippingAddressId || ""}
                        onChange={(e) =>
                          setShippingAddressId(
                            e.target.value ? parseInt(e.target.value) : null
                          )
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
                              setNewAddress({
                                ...newAddress,
                                name: e.target.value,
                              })
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
                              setNewAddress({
                                ...newAddress,
                                city: e.target.value,
                              })
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
                </>
              )}
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
                    submitting ||
                    (isGuest
                      ? !guestEmail || !guestName || !billingAddress.name || !billingAddress.line1 || !billingAddress.city
                      : !billingAddressId || !shippingAddressId)
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
