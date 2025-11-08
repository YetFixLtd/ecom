import axios from "axios";
import type {
  ProductListParams,
  ProductListResponse,
  ProductResponse,
  ProductVariantsResponse,
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
 * Get a paginated list of published products with filtering and sorting
 * Public endpoint - no authentication required
 */
export async function getProducts(
  params?: ProductListParams
): Promise<ProductListResponse> {
  const response = await api.get("/products", {
    params: {
      search: params?.search,
      category: params?.category,
      brand: params?.brand,
      min_price: params?.min_price,
      max_price: params?.max_price,
      featured: params?.featured,
      sort: params?.sort,
      order: params?.order,
      per_page: params?.per_page,
      page: params?.page,
    },
  });
  return response.data;
}

/**
 * Get a single product by ID
 * Public endpoint - no authentication required
 */
export async function getProduct(
  id: number
): Promise<ProductResponse> {
  const response = await api.get(`/products/${id}`);
  return response.data;
}

/**
 * Get product variants with inventory and attributes
 * Public endpoint - no authentication required
 */
export async function getProductVariants(
  id: number
): Promise<ProductVariantsResponse> {
  const response = await api.get(`/products/${id}/variants`);
  return response.data;
}

