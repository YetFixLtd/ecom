import axios from "axios";
import type {
  BrandListResponse,
  BrandResponse,
  BrandListParams,
} from "../../../types/client";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Get all brands with optional search and sorting
 * Public endpoint - no authentication required
 */
export async function getBrands(
  params?: BrandListParams
): Promise<BrandListResponse> {
  const response = await api.get("/brands", {
    params: {
      search: params?.search,
      sort: params?.sort,
      order: params?.order,
    },
  });
  return response.data;
}

/**
 * Get a single brand by ID with product count
 * Public endpoint - no authentication required
 */
export async function getBrand(
  id: number
): Promise<BrandResponse> {
  const response = await api.get(`/brands/${id}`);
  return response.data;
}

