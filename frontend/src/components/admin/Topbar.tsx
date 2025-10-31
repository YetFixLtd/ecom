"use client";

import { useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";

export function Topbar() {
  const router = useRouter();

  const onLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.replace("/admin/login");
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
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
