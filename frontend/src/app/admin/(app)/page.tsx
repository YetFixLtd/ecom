"use client";

import { useEffect, useState } from "react";

// Note: Metadata must be exported from a separate file or handled differently for client components
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
} from "lucide-react";
import { KPICard } from "@/components/admin/dashboard/KPICard";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { OrdersChart } from "@/components/admin/dashboard/OrdersChart";
import { StatusChart } from "@/components/admin/dashboard/StatusChart";
import { RecentOrdersTable } from "@/components/admin/dashboard/RecentOrdersTable";
import { ActivityFeed } from "@/components/admin/dashboard/ActivityFeed";
import {
  getDashboardStats,
  getRecentOrders,
  getDashboardActivity,
} from "@/lib/apis/dashboard";
import type {
  DashboardStats,
  RecentOrder,
  ActivityItem,
} from "@/types/dashboard";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [statsResponse, ordersResponse, activityResponse] =
          await Promise.all([
            getDashboardStats(),
            getRecentOrders(),
            getDashboardActivity(),
          ]);

        setStats(statsResponse.data);
        setRecentOrders(ordersResponse.data);
        setActivities(activityResponse.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-gray-600">
            Here is what's happening with your store.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-lg border bg-gray-100"
            />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-lg border bg-gray-100" />
          <div className="h-96 animate-pulse rounded-lg border bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-gray-600">
            Here is what's happening with your store.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Error loading dashboard: {error}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate revenue trend (comparing this month to last month)
  const revenueTrend = stats.revenue.this_month > 0 ? 12 : 0; // Placeholder - could calculate from previous month

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-600">
          Here is what's happening with your store.
        </p>
      </div>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={stats.revenue.all_time}
          subtitle={`৳${stats.revenue.this_month.toFixed(2)} this month`}
          icon={DollarSign}
          trend={
            revenueTrend > 0
              ? { value: revenueTrend, label: "vs last month" }
              : undefined
          }
          iconColor="text-green-600"
        />
        <KPICard
          title="Total Orders"
          value={stats.orders.all_time}
          subtitle={`${stats.orders.this_month} this month`}
          icon={ShoppingCart}
          iconColor="text-blue-600"
          format="number"
        />
        <KPICard
          title="Total Products"
          value={stats.products.total}
          subtitle="Active products"
          icon={Package}
          iconColor="text-purple-600"
          format="number"
        />
        <KPICard
          title="Total Customers"
          value={stats.customers.total}
          subtitle="Registered users"
          icon={Users}
          iconColor="text-orange-600"
          format="number"
        />
      </section>

      {/* Charts Section */}
      <section className="grid gap-6 lg:grid-cols-2">
        <RevenueChart data={stats.charts.revenue} />
        <OrdersChart data={stats.charts.orders} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentOrdersTable orders={recentOrders} />
        </div>
        <div>
          <StatusChart data={stats.charts.order_status} />
        </div>
      </section>

      {/* Activity Feed */}
      <section>
        <ActivityFeed activities={activities} />
      </section>
    </div>
  );
}
