import axios from "axios";
import { getAdminTokenFromCookies } from "@/lib/cookies";

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

// ========================================
// Types
// ========================================

export interface OrderItem {
  id: number;
  variant_id: number;
  product_name: string;
  variant_sku: string;
  qty: number;
  fulfilled_qty?: number;
  remaining_qty?: number;
  unit_price: number;
  discount_total: number;
  tax_total: number;
  total: number;
  variant?: {
    id: number;
    sku: string;
  };
}

export interface Payment {
  id: number;
  provider: string;
  provider_ref: string | null;
  amount: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface FulfillmentItem {
  id: number;
  fulfillment_id: number;
  order_item_id: number;
  qty: number;
  order_item?: OrderItem;
}

export type OrderStatus = "pending" | "paid" | "fulfilled" | "canceled" | "refunded";
export type FulfillmentStatus = "pending" | "packed" | "shipped" | "delivered" | "canceled" | "returned";

export interface Fulfillment {
  id: number;
  order_id: number;
  status: FulfillmentStatus;
  tracking_number: string | null;
  carrier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  order?: {
    id: number;
    order_number: string;
    status: string;
    grand_total: number;
    currency: string;
    user?: {
      id: number;
      email: string;
      full_name: string;
      phone?: string | null;
    };
    shipping_address?: {
      name: string;
      line1: string;
      line2: string | null;
      city: string;
      state_region: string | null;
      postal_code: string | null;
      country_code: string;
    };
  };
  items?: FulfillmentItem[];
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  shipping_option: string | null;
  tax_total: number;
  grand_total: number;
  user?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone?: string | null;
  };
  billing_address?: {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state_region: string | null;
    postal_code: string | null;
    country_code: string;
    full_address: string;
  };
  shipping_address?: {
    id: number;
    name: string;
    contact_name: string | null;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state_region: string | null;
    postal_code: string | null;
    country_code: string;
    full_address: string;
  };
  shipping_method?: {
    id: number;
    name: string;
    code: string;
    carrier: string | null;
    estimated_days: number | null;
  };
  items?: OrderItem[];
  payments?: Payment[];
  fulfillments?: Fulfillment[];
  fulfillments_count?: number;
  placed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderListParams {
  page?: number;
  per_page?: number;
  status?: OrderStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  sort?: string;
}

export interface OrderListResponse {
  data: Order[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateFulfillmentData {
  items: Array<{
    order_item_id: number;
    qty: number;
  }>;
  warehouse_id?: number;
  tracking_number?: string;
  carrier?: string;
}

export interface UpdateFulfillmentData {
  tracking_number?: string;
  carrier?: string;
}

export interface UpdateFulfillmentStatusData {
  status: FulfillmentStatus;
}

export interface UpdateOrderStatusData {
  status: "pending" | "paid" | "fulfilled" | "canceled" | "refunded";
}

// ========================================
// API Functions
// ========================================

/**
 * Get a paginated list of all orders
 * Requires: admin or super_admin role
 */
export async function getOrders(
  params?: OrderListParams
): Promise<OrderListResponse> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/orders", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single order by ID
 * Requires: admin or super_admin role
 */
export async function getOrder(id: number): Promise<{ data: Order }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get(`/admin/orders/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update order status
 * Requires: admin or super_admin role
 */
export async function updateOrderStatus(
  id: number,
  data: UpdateOrderStatusData
): Promise<{ message: string; data: Order }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.patch(`/admin/orders/${id}/status`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a fulfillment for an order
 * Requires: admin or super_admin role
 */
export async function createFulfillment(
  orderId: number,
  data: CreateFulfillmentData
): Promise<{ message: string; data: Fulfillment }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post(`/admin/orders/${orderId}/fulfillments`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Get a single fulfillment by ID
 * Requires: admin or super_admin role
 */
export async function getFulfillment(id: number): Promise<{ data: Fulfillment }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get(`/admin/fulfillments/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update fulfillment details (tracking number, carrier)
 * Requires: admin or super_admin role
 */
export async function updateFulfillment(
  id: number,
  data: UpdateFulfillmentData
): Promise<{ message: string; data: Fulfillment }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.patch(`/admin/fulfillments/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update fulfillment status
 * Requires: admin or super_admin role
 */
export async function updateFulfillmentStatus(
  id: number,
  data: UpdateFulfillmentStatusData
): Promise<{ message: string; data: Fulfillment }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.patch(`/admin/fulfillments/${id}/status`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

