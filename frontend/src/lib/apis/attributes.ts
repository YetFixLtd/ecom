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

export interface AttributeValue {
  id: number;
  attribute_id: number;
  value: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  position: number;
  is_filterable: boolean;
  created_at: string;
  updated_at: string;
  values_count?: number;
  values?: AttributeValue[];
}

export interface AttributeListParams {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
  with_values?: boolean;
}

export interface AttributeListResponse {
  data: Attribute[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateAttributeData {
  name: string;
  slug?: string;
  type?: string;
  position?: number;
  is_filterable?: boolean;
}

export interface UpdateAttributeData {
  name?: string;
  slug?: string;
  type?: string;
  position?: number;
  is_filterable?: boolean;
}

// ========================================
// API Functions
// ========================================

/**
 * Get a paginated list of all attributes
 * Requires: admin or super_admin role
 */
export async function getAttributes(
  token: string,
  params?: AttributeListParams
): Promise<AttributeListResponse> {
  const response = await api.get("/admin/attributes", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single attribute by ID
 * Requires: admin or super_admin role
 */
export async function getAttribute(
  token: string,
  id: number,
  params?: { with_values?: boolean }
): Promise<{ data: Attribute }> {
  const response = await api.get(`/admin/attributes/${id}`, {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Create a new attribute
 * Requires: admin or super_admin role
 */
export async function createAttribute(
  token: string,
  data: CreateAttributeData
): Promise<{ data: Attribute }> {
  const response = await api.post("/admin/attributes", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing attribute
 * Requires: admin or super_admin role
 */
export async function updateAttribute(
  token: string,
  id: number,
  data: UpdateAttributeData
): Promise<{ data: Attribute }> {
  const response = await api.put(`/admin/attributes/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Delete an attribute
 * Requires: admin or super_admin role
 * Note: Cannot delete attribute with values
 */
export async function deleteAttribute(
  token: string,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/admin/attributes/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}
