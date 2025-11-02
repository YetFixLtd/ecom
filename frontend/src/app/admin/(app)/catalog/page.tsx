"use client";

import Link from "next/link";
import { Package, Tags, FolderTree, Box } from "lucide-react";

const catalogSections = [
  {
    title: "Products",
    description: "Manage your product catalog",
    icon: Package,
    href: "/admin/catalog/products",
    color: "bg-blue-500",
  },
  {
    title: "Categories",
    description: "Organize products into categories",
    icon: FolderTree,
    href: "/admin/catalog/categories",
    color: "bg-green-500",
  },
  {
    title: "Brands",
    description: "Manage product brands",
    icon: Box,
    href: "/admin/catalog/brands",
    color: "bg-purple-500",
  },
  {
    title: "Attributes",
    description: "Manage product attributes and values",
    icon: Tags,
    href: "/admin/catalog/attributes",
    color: "bg-orange-500",
  },
];

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catalog Management</h1>
        <p className="text-sm text-gray-600">
          Manage your product catalog, categories, brands, and attributes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {catalogSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 inline-flex rounded-lg p-3 ${section.color} text-white`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{section.title}</h3>
              <p className="text-sm text-gray-600">{section.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
