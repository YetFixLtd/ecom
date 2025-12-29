"use client";

import {
  ShoppingCart,
  Package,
  ArrowLeftRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import type { ActivityItem } from "@/types/dashboard";

interface ActivityFeedProps {
  activities: ActivityItem[];
}

const ACTIVITY_ICONS: Record<string, typeof ShoppingCart> = {
  order: ShoppingCart,
  inventory_adjustment: TrendingUp,
  transfer: ArrowLeftRight,
  product: Package,
};

const ACTIVITY_COLORS: Record<string, string> = {
  order: "bg-blue-100 text-blue-600",
  inventory_adjustment: "bg-yellow-100 text-yellow-600",
  transfer: "bg-purple-100 text-purple-600",
  product: "bg-green-100 text-green-600",
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "Just now";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number | null, currency: string | null) => {
    if (amount === null || currency === null) return null;
    // Format with Bangladeshi Taka symbol
    const formatted = new Intl.NumberFormat("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return `৳${formatted}`;
  };

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <p className="text-sm text-gray-600">No recent activity.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600">Latest system activities</p>
      </div>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = ACTIVITY_ICONS[activity.type] || Package;
          const colorClass =
            ACTIVITY_COLORS[activity.type] || "bg-gray-100 text-gray-600";

          return (
            <div
              key={index}
              className="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0"
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {activity.description}
                    </p>
                    {activity.amount !== null && activity.currency && (
                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {formatCurrency(activity.amount, activity.currency)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

