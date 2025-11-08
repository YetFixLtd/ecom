import axios from "axios";
import type {
  CartResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
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
 * Get the authenticated user's cart
 * Requires authentication
 */
export async function getCart(token: string): Promise<CartResponse> {
  const response = await api.get("/cart", {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Add an item to the cart
 * Requires authentication
 */
export async function addToCart(
  token: string,
  data: AddToCartRequest
): Promise<CartResponse & { message: string }> {
  const response = await api.post("/cart/items", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update cart item quantity
 * Requires authentication
 */
export async function updateCartItem(
  token: string,
  itemId: number,
  data: UpdateCartItemRequest
): Promise<CartResponse & { message: string }> {
  const response = await api.put(`/cart/items/${itemId}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Remove an item from the cart
 * Requires authentication
 */
export async function removeCartItem(
  token: string,
  itemId: number
): Promise<CartResponse & { message: string }> {
  const response = await api.delete(`/cart/items/${itemId}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Clear the entire cart
 * Requires authentication
 */
export async function clearCart(
  token: string
): Promise<{ message: string }> {
  const response = await api.delete("/cart", {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

