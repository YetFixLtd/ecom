"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import {
  getAddresses,
  deleteAddress,
  setDefaultBilling,
  setDefaultShipping,
} from "@/lib/apis/client/addresses";
import { getUserTokenFromCookies } from "@/lib/cookies";
import type { Address, CreateAddressRequest } from "@/types/client";

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateAddressRequest>({
    name: "",
    contact_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state_region: "",
    postal_code: "",
    country_code: "US",
    is_default_billing: false,
    is_default_shipping: false,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    const token = await getUserTokenFromCookies();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await getAddresses(token);
      setAddresses(response.data);
    } catch (error) {
      console.error("Error loading addresses:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this address?")) return;

    const token = await getUserTokenFromCookies();
    if (!token) return;

    try {
      await deleteAddress(token, id);
      await loadAddresses();
    } catch (error) {
      alert("Failed to delete address");
    }
  }

  async function handleSetDefaultBilling(id: number) {
    const token = await getUserTokenFromCookies();
    if (!token) return;

    try {
      await setDefaultBilling(token, id);
      await loadAddresses();
    } catch (error) {
      alert("Failed to set default billing address");
    }
  }

  async function handleSetDefaultShipping(id: number) {
    const token = await getUserTokenFromCookies();
    if (!token) return;

    try {
      await setDefaultShipping(token, id);
      await loadAddresses();
    } catch (error) {
      alert("Failed to set default shipping address");
    }
  }

  function handleEdit(address: Address) {
    setEditingId(address.id);
    setFormData({
      name: address.name,
      contact_name: address.contact_name || "",
      phone: address.phone || "",
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state_region: address.state_region || "",
      postal_code: address.postal_code || "",
      country_code: address.country_code,
      is_default_billing: address.is_default_billing,
      is_default_shipping: address.is_default_shipping,
    });
    setShowForm(true);
  }

  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      contact_name: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      state_region: "",
      postal_code: "",
      country_code: "US",
      is_default_billing: false,
      is_default_shipping: false,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = await getUserTokenFromCookies();
    if (!token) return;

    try {
      if (editingId) {
        const { updateAddress } = await import("@/lib/apis/client/addresses");
        await updateAddress(token, editingId, formData);
      } else {
        const { createAddress } = await import("@/lib/apis/client/addresses");
        await createAddress(token, formData);
      }
      await loadAddresses();
      handleCancel();
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to save address");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading addresses...</p>
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
            <h1 className="text-3xl font-bold text-zinc-900">My Addresses</h1>
            <button
              onClick={() => {
                handleCancel();
                setShowForm(!showForm);
              }}
              className="bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800 transition-colors"
            >
              {showForm ? "Cancel" : "+ Add New Address"}
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-zinc-900 mb-4">
                {editingId ? "Edit Address" : "New Address"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.contact_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      value={formData.line1}
                      onChange={(e) =>
                        setFormData({ ...formData, line1: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formData.line2}
                      onChange={(e) =>
                        setFormData({ ...formData, line2: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      State/Region
                    </label>
                    <input
                      type="text"
                      value={formData.state_region}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          state_region: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          postal_code: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Country Code *
                    </label>
                    <input
                      type="text"
                      value={formData.country_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          country_code: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_default_billing}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_default_billing: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-zinc-700">
                      Set as default billing address
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_default_shipping}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_default_shipping: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    <span className="text-sm text-zinc-700">
                      Set as default shipping address
                    </span>
                  </label>
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800"
                  >
                    {editingId ? "Update" : "Create"} Address
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bg-zinc-200 text-zinc-900 px-6 py-2 rounded-md hover:bg-zinc-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {addresses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="bg-white rounded-lg shadow-sm border border-zinc-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-zinc-900 mb-1">
                        {address.name}
                      </h3>
                      {address.contact_name && (
                        <p className="text-sm text-zinc-600">
                          {address.contact_name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {address.is_default_billing && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Billing
                        </span>
                      )}
                      {address.is_default_shipping && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                          Shipping
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-zinc-700 mb-4">{address.full_address}</p>
                  {address.phone && (
                    <p className="text-sm text-zinc-600 mb-4">
                      Phone: {address.phone}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleSetDefaultBilling(address.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Set Billing
                    </button>
                    <button
                      onClick={() => handleSetDefaultShipping(address.id)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Set Shipping
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-zinc-500 text-lg mb-4">No addresses found</p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-zinc-900 text-white px-6 py-3 rounded-md hover:bg-zinc-800"
              >
                Add Your First Address
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

