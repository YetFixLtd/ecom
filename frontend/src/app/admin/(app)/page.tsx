import { adminApiFetch } from "@/lib/admin-api";
import type { Administrator } from "@/types/admin";
export const metadata = { title: "Dashboard" };

type MeResponse = { data: Administrator };

export default async function AdminDashboardPage() {
  let admin: Administrator | null = null;
  try {
    const me = await adminApiFetch<MeResponse>("/admin/auth/me");
    admin = me.data;
  } catch {
    // middleware should protect; render minimal fallback
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {admin
            ? `Welcome, ${admin.first_name || ""} ${
                admin.last_name || admin.email
              }`
            : "Welcome"}
        </h2>
        <p className="text-sm text-gray-600">
          Here is what’s happening with your store.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI title="Products" value="—" />
        <KPI title="Categories" value="—" />
        <KPI title="Low Stock" value="—" />
        <KPI title="Pending Transfers" value="—" />
      </section>

      <section>
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 font-medium">Recent activity</div>
          <p className="text-sm text-gray-600">No recent activity yet.</p>
        </div>
      </section>
    </div>
  );
}

function KPI({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-600">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}
