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
 * Requires authentication
 */
export async function getOrder(
  token: string,
  id: number
): Promise<OrderResponse> {
  const response = await api.get(`/orders/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create an order from the user's cart (checkout)
 * Requires authentication
 */
export async function createOrder(
  token: string,
  data: CreateOrderRequest
): Promise<OrderResponse & { message: string }> {
  const response = await api.post("/orders", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

