import axios from "axios";

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

export interface ShippingMethod {
  id: number;
  name: string;
  code: string;
  carrier: string | null;
  description: string | null;
  calculation_type: "flat" | "weight" | "price" | "weight_and_price";
  base_rate: number;
  per_kg_rate: number | null;
  per_item_rate: number | null;
  free_shipping_threshold: number | null;
  max_weight_kg: number | null;
  estimated_days: number | null;
  is_active: boolean;
  sort_order: number;
  config: Record<string, any> | null;
  orders_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethodListParams {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
  is_active?: boolean;
}

export interface ShippingMethodListResponse {
  data: ShippingMethod[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateShippingMethodData {
  name: string;
  code: string;
  carrier?: string;
  description?: string;
  calculation_type: "flat" | "weight" | "price" | "weight_and_price";
  base_rate: number;
  per_kg_rate?: number;
  per_item_rate?: number;
  free_shipping_threshold?: number;
  max_weight_kg?: number;
  estimated_days?: number;
  is_active?: boolean;
  sort_order?: number;
  config?: Record<string, any>;
}

export interface UpdateShippingMethodData {
  name?: string;
  code?: string;
  carrier?: string;
  description?: string;
  calculation_type?: "flat" | "weight" | "price" | "weight_and_price";
  base_rate?: number;
  per_kg_rate?: number;
  per_item_rate?: number;
  free_shipping_threshold?: number;
  max_weight_kg?: number;
  estimated_days?: number;
  is_active?: boolean;
  sort_order?: number;
  config?: Record<string, any>;
}

// ========================================
// API Functions
// ========================================

/**
 * Get a paginated list of all shipping methods
 * Requires: admin or super_admin role
 */
export async function getShippingMethods(
  token: string,
  params?: ShippingMethodListParams
): Promise<ShippingMethodListResponse> {
  const response = await api.get("/admin/shipping-methods", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single shipping method by ID
 * Requires: admin or super_admin role
 */
export async function getShippingMethod(
  token: string,
  id: number
): Promise<{ data: ShippingMethod }> {
  const response = await api.get(`/admin/shipping-methods/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a new shipping method
 * Requires: admin or super_admin role
 */
export async function createShippingMethod(
  token: string,
  data: CreateShippingMethodData
): Promise<{ data: ShippingMethod }> {
  const response = await api.post("/admin/shipping-methods", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing shipping method
 * Requires: admin or super_admin role
 */
export async function updateShippingMethod(
  token: string,
  id: number,
  data: UpdateShippingMethodData
): Promise<{ data: ShippingMethod }> {
  const response = await api.put(`/admin/shipping-methods/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Delete a shipping method
 * Requires: admin or super_admin role
 */
export async function deleteShippingMethod(
  token: string,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/admin/shipping-methods/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

