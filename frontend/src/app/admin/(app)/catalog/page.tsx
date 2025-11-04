import { redirect } from "next/navigation";

export default function CatalogPage() {
  // Redirect to products page since catalog is now a submenu
  redirect("/admin/catalog/products");
}
