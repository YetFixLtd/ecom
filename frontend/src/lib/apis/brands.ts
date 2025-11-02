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

export interface Brand {
  id: number;
  name: string;
  slug: string;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandListParams {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
}

export interface BrandListResponse {
  data: Brand[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateBrandData {
  name: string;
  slug?: string;
  website_url?: string;
  logo_url?: string;
  description?: string;
}

export interface UpdateBrandData {
  name?: string;
  slug?: string;
  website_url?: string;
  logo_url?: string;
  description?: string;
}

// ========================================
// API Functions
// ========================================

/**
 * Get a paginated list of all brands
 * Requires: admin or super_admin role
 */
export async function getBrands(
  token: string,
  params?: BrandListParams
): Promise<BrandListResponse> {
  const response = await api.get("/admin/brands", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single brand by ID
 * Requires: admin or super_admin role
 */
export async function getBrand(
  token: string,
  id: number
): Promise<{ data: Brand }> {
  const response = await api.get(`/admin/brands/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a new brand
 * Requires: admin or super_admin role
 */
export async function createBrand(
  token: string,
  data: CreateBrandData
): Promise<{ data: Brand }> {
  const response = await api.post("/admin/brands", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing brand
 * Requires: admin or super_admin role
 */
export async function updateBrand(
  token: string,
  id: number,
  data: UpdateBrandData
): Promise<{ data: Brand }> {
  const response = await api.put(`/admin/brands/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Delete a brand
 * Requires: admin or super_admin role
 */
export async function deleteBrand(
  token: string,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/admin/brands/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}
