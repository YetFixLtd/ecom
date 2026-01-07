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

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
  position: number;
  image_url: string | null;
  image_path: string | null;
  is_active: boolean;
  is_featured: boolean;
  status: "active" | "inactive";
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  products_count?: number;
  parent?: Category;
  children?: Category[];
}

export interface CategoryListParams {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
  parent_id?: number | null;
  include_all?: boolean;
  with_children?: boolean;
  with_parent?: boolean;
}

export interface CategoryListResponse {
  data: Category[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  position?: number;
  is_active?: boolean;
  is_featured?: boolean;
  status?: "active" | "inactive";
  meta_title?: string;
  meta_description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  position?: number;
  is_active?: boolean;
  is_featured?: boolean;
  status?: "active" | "inactive";
  meta_title?: string;
  meta_description?: string;
}

// ========================================
// API Functions
// ========================================

/**
 * Get a paginated list of all categories
 * Requires: admin or super_admin role
 */
export async function getCategories(
  token: string,
  params?: CategoryListParams
): Promise<CategoryListResponse> {
  const response = await api.get("/admin/categories", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single category by ID
 * Requires: admin or super_admin role
 */
export async function getCategory(
  token: string,
  id: number,
  params?: { with_children?: boolean; with_parent?: boolean }
): Promise<{ data: Category }> {
  const response = await api.get(`/admin/categories/${id}`, {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Create a new category
 * Requires: admin or super_admin role
 */
export async function createCategory(
  token: string,
  data: CreateCategoryData,
  image?: File
): Promise<{ data: Category }> {
  const formData = new FormData();

  // Append all data fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Convert boolean values to '1' or '0' for Laravel
      if (typeof value === "boolean") {
        formData.append(key, value ? "1" : "0");
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Append image if provided
  if (image) {
    formData.append("image", image);
  }

  const response = await api.post("/admin/categories", formData, {
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Update an existing category
 * Requires: admin or super_admin role
 */
export async function updateCategory(
  token: string,
  id: number,
  data: UpdateCategoryData,
  image?: File
): Promise<{ data: Category }> {
  const formData = new FormData();

  // Append all data fields
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // Convert boolean values to '1' or '0' for Laravel
      if (typeof value === "boolean") {
        formData.append(key, value ? "1" : "0");
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // Append image if provided
  if (image) {
    formData.append("image", image);
  }

  const response = await api.post(
    `/admin/categories/${id}?_method=PUT`,
    formData,
    {
      headers: {
        ...getAuthHeaders(token),
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

/**
 * Delete a category
 * Requires: admin or super_admin role
 * Note: Cannot delete category with children
 */
export async function deleteCategory(
  token: string,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/admin/categories/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Reorder categories by updating their positions
 * Requires: admin or super_admin role
 */
export async function reorderCategories(
  token: string,
  categories: { id: number; position: number }[]
): Promise<{ message: string }> {
  const response = await api.post(
    "/admin/categories/reorder",
    { categories },
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}
