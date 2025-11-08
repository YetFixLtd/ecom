import axios from "axios";
import type {
  AddressListResponse,
  AddressResponse,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "../../../types/client";

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
 * Get all addresses for the authenticated user
 * Requires authentication
 */
export async function getAddresses(
  token: string
): Promise<AddressListResponse> {
  const response = await api.get("/addresses", {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Get a single address by ID
 * Requires authentication
 */
export async function getAddress(
  token: string,
  id: number
): Promise<AddressResponse> {
  const response = await api.get(`/addresses/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a new address
 * Requires authentication
 */
export async function createAddress(
  token: string,
  data: CreateAddressRequest
): Promise<AddressResponse & { message: string }> {
  const response = await api.post("/addresses", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing address
 * Requires authentication
 */
export async function updateAddress(
  token: string,
  id: number,
  data: UpdateAddressRequest
): Promise<AddressResponse & { message: string }> {
  const response = await api.put(`/addresses/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Delete an address
 * Requires authentication
 */
export async function deleteAddress(
  token: string,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/addresses/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Set an address as the default billing address
 * Requires authentication
 */
export async function setDefaultBilling(
  token: string,
  id: number
): Promise<AddressResponse & { message: string }> {
  const response = await api.post(
    `/addresses/${id}/set-default-billing`,
    {},
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}

/**
 * Set an address as the default shipping address
 * Requires authentication
 */
export async function setDefaultShipping(
  token: string,
  id: number
): Promise<AddressResponse & { message: string }> {
  const response = await api.post(
    `/addresses/${id}/set-default-shipping`,
    {},
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}
