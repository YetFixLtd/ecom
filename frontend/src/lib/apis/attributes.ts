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
  value_key?: string | null;
  position: number;
  created_at?: string;
  updated_at?: string;
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

export interface AttributeValueListParams {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
}

export interface AttributeValueListResponse {
  data: AttributeValue[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateAttributeValueData {
  value: string;
  value_key?: string | null;
  position?: number;
}

export interface UpdateAttributeValueData {
  value?: string;
  value_key?: string | null;
  position?: number;
}

export interface ReorderAttributeValuesData {
  values: Array<{
    id: number;
    position: number;
  }>;
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

// ========================================
// Attribute Values API Functions
// ========================================

/**
 * Get a paginated list of all values for a specific attribute
 * Requires: admin or super_admin role
 */
export async function getAttributeValues(
  token: string,
  attributeId: number,
  params?: AttributeValueListParams
): Promise<AttributeValueListResponse> {
  const response = await api.get(`/admin/attributes/${attributeId}/values`, {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single attribute value by ID
 * Requires: admin or super_admin role
 */
export async function getAttributeValue(
  token: string,
  attributeId: number,
  id: number
): Promise<{ data: AttributeValue }> {
  const response = await api.get(`/admin/attributes/${attributeId}/values/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a new attribute value
 * Requires: admin or super_admin role
 */
export async function createAttributeValue(
  token: string,
  attributeId: number,
  data: CreateAttributeValueData
): Promise<{ data: AttributeValue }> {
  const response = await api.post(`/admin/attributes/${attributeId}/values`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing attribute value
 * Requires: admin or super_admin role
 */
export async function updateAttributeValue(
  token: string,
  attributeId: number,
  id: number,
  data: UpdateAttributeValueData
): Promise<{ data: AttributeValue }> {
  const response = await api.put(`/admin/attributes/${attributeId}/values/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Delete an attribute value
 * Requires: admin or super_admin role
 * Note: Cannot delete value used in product variants
 */
export async function deleteAttributeValue(
  token: string,
  attributeId: number,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/admin/attributes/${attributeId}/values/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Reorder attribute values
 * Requires: admin or super_admin role
 */
export async function reorderAttributeValues(
  token: string,
  attributeId: number,
  data: ReorderAttributeValuesData
): Promise<{ message: string }> {
  const response = await api.post(`/admin/attributes/${attributeId}/values/reorder`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}
