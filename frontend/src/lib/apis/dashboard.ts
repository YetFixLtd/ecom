import axios from "axios";
import { getAdminTokenFromCookies } from "@/lib/cookies";
import type {
  DashboardStats,
  RecentOrder,
  ActivityItem,
} from "@/types/dashboard";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper function to create auth headers
const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Get dashboard statistics and chart data
 * Requires: admin or super_admin role
 */
export async function getDashboardStats(): Promise<{
  data: DashboardStats;
}> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/dashboard/stats", {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Get recent orders for dashboard
 * Requires: admin or super_admin role
 */
export async function getRecentOrders(): Promise<{
  data: RecentOrder[];
}> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/dashboard/recent-orders", {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Get dashboard activity feed
 * Requires: admin or super_admin role
 */
export async function getDashboardActivity(): Promise<{
  data: ActivityItem[];
}> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/dashboard/activity", {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

