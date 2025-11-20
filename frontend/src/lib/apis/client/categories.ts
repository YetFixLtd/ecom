import axios from "axios";
import type {
  CategoryListResponse,
  CategoryResponse,
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
 * Get all categories (tree structure by default, or flat if requested)
 * Public endpoint - no authentication required
 */
export async function getCategories(
  flat?: boolean,
  featured?: boolean
): Promise<CategoryListResponse> {
  const response = await api.get("/categories", {
    params: {
      flat: flat ? "1" : undefined,
      featured: featured ? "1" : undefined,
    },
  });
  return response.data;
}

/**
 * Get a single category by ID with product count
 * Public endpoint - no authentication required
 */
export async function getCategory(id: number): Promise<CategoryResponse> {
  const response = await api.get(`/categories/${id}`);
  return response.data;
}
