"use client";

import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  iconColor?: string;
  format?: "currency" | "number";
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconColor = "text-blue-600",
  format = "currency",
}: KPICardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === "number") {
      if (format === "currency") {
        if (val >= 1000000) {
          return `৳${(val / 1000000).toFixed(2)}M`;
        }
        if (val >= 1000) {
          return `৳${(val / 1000).toFixed(2)}K`;
        }
        return `৳${val.toFixed(2)}`;
      } else {
        // Format as number
        if (val >= 1000000) {
          return `${(val / 1000000).toFixed(2)}M`;
        }
        if (val >= 1000) {
          return `${(val / 1000).toFixed(2)}K`;
        }
        return val.toLocaleString();
      }
    }
    return val;
  };

  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatValue(value)}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              {isPositiveTrend ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-sm font-medium ${
                  isPositiveTrend ? "text-green-600" : "text-red-600"
                }`}
              >
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div className={`rounded-lg bg-blue-50 p-3 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

