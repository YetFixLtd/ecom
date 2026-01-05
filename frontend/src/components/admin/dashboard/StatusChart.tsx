"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { OrderStatusData } from "@/types/dashboard";

interface StatusChartProps {
  data: OrderStatusData[];
}

const COLORS = {
  pending: "#f59e0b",
  paid: "#3b82f6",
  fulfilled: "#10b981",
  canceled: "#ef4444",
  refunded: "#8b5cf6",
  partial: "#6366f1",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  canceled: "Canceled",
  refunded: "Refunded",
  partial: "Partial",
};

export function StatusChart({ data }: StatusChartProps) {
  const chartData = data.map((item) => ({
    name: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    status: item.status,
  }));

  const getColor = (status: string) => {
    return COLORS[status as keyof typeof COLORS] || "#6b7280";
  };

  return (
    <div className="rounded-lg border bg-white p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Order Status Distribution
        </h3>
        <p className="text-sm text-gray-600">Current order statuses</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${percent !== undefined ? (percent * 100).toFixed(0) : 0}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry.status)}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

