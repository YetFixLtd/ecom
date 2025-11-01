"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { adminLogout } from "@/lib/apis/auth";
import { useState } from "react";

export function Topbar() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const onLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // Get the admin token from cookies
      const token = getAdminTokenFromCookie();

      if (token) {
        // Call the logout API to invalidate the token on the server
        await adminLogout(token);
      }
    } catch (error) {
      // Even if the API call fails, we still log out locally
      console.error("Logout error:", error);
    } finally {
      // Delete the admin token cookie
      deleteAdminTokenCookie();

      // Redirect to login page
      router.replace("/admin/login");
      setIsLoggingOut(false);
    }
  };

  // Helper function to get admin token from cookie
  const getAdminTokenFromCookie = (): string | null => {
    const match = document.cookie.match(/(?:^|; )admin_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  // Helper function to delete admin token cookie
  const deleteAdminTokenCookie = () => {
    document.cookie = "admin_token=; path=/; max-age=0";
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-blue-600" aria-hidden />
        <div className="font-semibold">Ecom Admin</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </header>
  );
}
