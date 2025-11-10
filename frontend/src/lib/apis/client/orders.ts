import axios from "axios";
import type {
  OrderListResponse,
  OrderResponse,
  CreateOrderRequest,
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
 * Get the authenticated user's orders
 * Requires authentication
 */
export async function getOrders(
  token: string,
  status?: string,
  perPage?: number
): Promise<OrderListResponse> {
  const response = await api.get("/orders", {
    headers: getAuthHeaders(token),
    params: {
      status,
      per_page: perPage,
    },
  });
  return response.data;
}

/**
 * Get a single order by ID
 * Supports both authenticated users and guest orders
 */
export async function getOrder(
  id: number,
  token?: string
): Promise<OrderResponse> {
  const headers = token ? getAuthHeaders(token) : {};
  const response = await api.get(`/orders/${id}`, {
    headers,
  });
  return response.data;
}

/**
 * Create an order from the user's cart (checkout)
 * Supports both authenticated and guest checkout
 */
export async function createOrder(
  data: CreateOrderRequest,
  token?: string
): Promise<OrderResponse & { message: string }> {
  const headers = token ? getAuthHeaders(token) : {};
  const response = await api.post("/orders", data, {
    headers,
  });
  return response.data;
}

