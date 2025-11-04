"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Shield,
  ChevronDown,
  ChevronRight,
  FolderTree,
  Box,
  Tags,
} from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    Icon: LayoutDashboard,
    disabled: false,
  },
  {
    href: "/admin/catalog",
    label: "Catalog",
    Icon: Package,
    disabled: false,
    submenu: [
      {
        href: "/admin/catalog/products",
        label: "Products",
        Icon: Package,
      },
      {
        href: "/admin/catalog/categories",
        label: "Categories",
        Icon: FolderTree,
      },
      {
        href: "/admin/catalog/brands",
        label: "Brands",
        Icon: Box,
      },
      {
        href: "/admin/catalog/attributes",
        label: "Attributes",
        Icon: Tags,
      },
    ],
  },
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
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  // Auto-expand catalog menu if any catalog page is active
  useEffect(() => {
    if (pathname.startsWith("/admin/catalog")) {
      setExpandedMenus((prev) => new Set(prev).add("/admin/catalog"));
    }
  }, [pathname]);

  const toggleMenu = (href: string) => {
    setExpandedMenus((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(href)) {
        newSet.delete(href);
      } else {
        newSet.add(href);
      }
      return newSet;
    });
  };

  const isCatalogActive = pathname.startsWith("/admin/catalog");

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-white p-4 md:block">
      <div className="mb-6 flex items-center gap-2">
        <div className="h-6 w-6 rounded bg-blue-600" aria-hidden />
        <div className="text-lg font-semibold">Admin</div>
      </div>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : item.href === "/admin/catalog"
              ? isCatalogActive
              : pathname === item.href || pathname.startsWith(item.href + "/");

          const hasSubmenu = item.submenu && item.submenu.length > 0;
          const isExpanded = hasSubmenu && expandedMenus.has(item.href);

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
            <div key={item.href}>
              {hasSubmenu ? (
                <>
                  <button
                    onClick={() => toggleMenu(item.href)}
                    className={`${baseClasses} ${activeClasses} ${disabledClasses} w-full justify-between`}
                    disabled={item.disabled}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" aria-hidden />
                      <span>{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-2">
                      {item.submenu?.map((subItem) => {
                        const isSubActive =
                          pathname === subItem.href ||
                          pathname.startsWith(subItem.href + "/");
                        const SubIcon = subItem.Icon;
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                              isSubActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <SubIcon className="h-3.5 w-3.5" aria-hidden />
                            <span>{subItem.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href}
                  className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
