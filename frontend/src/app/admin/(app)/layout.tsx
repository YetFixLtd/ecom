import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import { Sidebar } from "@/components/admin/Sidebar";
import { Topbar } from "@/components/admin/Topbar";

export const metadata: Metadata = {
  title: {
    default: "Admin",
    template: "%s | Admin | Ecom",
  },
};

export default async function AdminAppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    redirect("/admin/login");
  }
  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="p-6 md:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
