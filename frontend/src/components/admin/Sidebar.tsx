"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Boxes, Shield } from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    Icon: LayoutDashboard,
    disabled: false,
  },
  { href: "/admin/catalog", label: "Catalog", Icon: Package, disabled: true },
  { href: "/admin/inventory", label: "Inventory", Icon: Boxes, disabled: true },
  {
    href: "/admin/manage",
    label: "Manage Admins",
    Icon: Shield,
    disabled: false,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-white p-4 md:block">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-blue-600" aria-hidden />
        <div className="text-lg font-semibold">Admin</div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          // For dashboard (/admin), only match exact path
          // For other routes, match if starts with the href
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const baseClasses =
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm";
          const activeClasses = isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-700 hover:bg-gray-50";
          const disabledClasses = item.disabled
            ? "opacity-50 pointer-events-none"
            : "";
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
