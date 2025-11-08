"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/client/Header";
import Footer from "@/components/client/Footer";
import { me, updateProfile, changePassword, logout } from "@/lib/apis/auth";
import { getUserTokenFromCookies, deleteUserTokenCookie } from "@/lib/cookies";
import type { User } from "@/types/client";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "password">("profile");
  const [profileData, setProfileData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const token = await getUserTokenFromCookies();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await me(token);
      setUser(response.data);
      setProfileData({
        email: response.data.email || "",
        first_name: response.data.first_name || "",
        last_name: response.data.last_name || "",
        phone: response.data.phone || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const token = await getUserTokenFromCookies();
    if (!token) return;

    setSaving(true);
    try {
      await updateProfile(token, profileData);
      setSuccess("Profile updated successfully");
      await loadProfile();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordData.password !== passwordData.password_confirmation) {
      setError("Passwords do not match");
      return;
    }

    const token = await getUserTokenFromCookies();
    if (!token) return;

    setSaving(true);
    try {
      await changePassword(token, passwordData);
      setSuccess("Password changed successfully. Please login again.");
      deleteUserTokenCookie();
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to change password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    const token = await getUserTokenFromCookies();
    if (token) {
      await logout(token);
    }
    deleteUserTokenCookie();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">Loading profile...</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">My Profile</h1>

          <div className="bg-white rounded-lg shadow-sm border border-zinc-200">
            <div className="border-b border-zinc-200">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-6 py-4 font-medium ${
                    activeTab === "profile"
                      ? "border-b-2 border-zinc-900 text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("password")}
                  className={`px-6 py-4 font-medium ${
                    activeTab === "password"
                      ? "border-b-2 border-zinc-900 text-zinc-900"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Change Password
                </button>
              </div>
            </div>

            <div className="p-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                  {success}
                </div>
              )}

              {activeTab === "profile" && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        setProfileData({ ...profileData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            first_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) =>
                          setProfileData({
                            ...profileData,
                            last_name: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData({ ...profileData, phone: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}

              {activeTab === "password" && (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          current_password: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.password}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          password: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.password_confirmation}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          password_confirmation: e.target.value,
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-zinc-300 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-zinc-900 text-white px-6 py-2 rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Changing..." : "Change Password"}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Link
              href="/addresses"
              className="text-blue-600 hover:text-blue-700"
            >
              Manage Addresses →
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

