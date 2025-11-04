import { redirect } from "next/navigation";

export default function InventoryPage() {
  // Redirect to warehouses page since inventory is now a submenu
  redirect("/admin/inventory/warehouses");
}

