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

// Helper function to create form data headers (for file uploads)
// Note: Don't set Content-Type - axios will set it with boundary automatically
const getFormDataHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

// ========================================
// Types
// ========================================

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  path_original: string;
  path_medium: string;
  path_thumb: string;
  alt_text: string | null;
  position: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariantAttributeValue {
  id: number;
  variant_id: number;
  attribute_id: number;
  attribute_value_id: number;
  attribute?: {
    id: number;
    name: string;
    slug: string;
  };
  attributeValue?: {
    id: number;
    value: string;
  };
}

export interface InventoryItem {
  id: number;
  variant_id: number;
  warehouse_id: number;
  on_hand: number;
  reserved: number;
  safety_stock: number;
  reorder_point: number;
  warehouse?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  currency: string;
  track_stock: boolean;
  allow_backorder: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  attributeValues?: ProductVariantAttributeValue[];
  inventoryItems?: InventoryItem[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  product_type: string;
  brand_id: number | null;
  published_status: string;
  is_active: boolean;
  is_featured: boolean;
  is_upcoming?: boolean;
  call_for_price?: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
  brand?: {
    id: number;
    name: string;
    slug: string;
  };
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  images?: ProductImage[];
  variants?: ProductVariant[];
  primary_image_path?: string;
}

export interface ProductListParams {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
  brand_id?: number;
  category_id?: number;
  published_status?: string;
  is_active?: boolean;
  product_type?: string;
  stockout?: boolean;
  zero_price?: boolean;
  is_upcoming?: boolean;
}

export interface ProductListResponse {
  data: Product[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface VariantInventoryData {
  warehouse_id: number;
  on_hand?: number;
  safety_stock?: number;
  reorder_point?: number;
}

export interface CreateProductVariantData {
  sku: string;
  price: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  currency?: string;
  track_stock?: boolean;
  allow_backorder?: boolean;
  status?: string;
  attribute_values?: Array<{
    attribute_id: number;
    attribute_value_id: number;
  }>;
  inventory?: VariantInventoryData[];
}

export interface CreateProductData {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  product_type: string;
  brand_id?: number | null;
  published_status?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_upcoming?: boolean;
  call_for_price?: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
  categories?: number[];
  images?: File[]; // Will be handled separately to avoid serialization
  variants?: CreateProductVariantData[];
}

export interface UpdateProductVariantData {
  id?: number;
  sku?: string;
  price?: number;
  compare_at_price?: number | null;
  cost_price?: number | null;
  currency?: string;
  track_stock?: boolean;
  allow_backorder?: boolean;
  status?: string;
  attribute_values?: Array<{
    attribute_id: number;
    attribute_value_id: number;
  }>;
  inventory?: VariantInventoryData[];
}

export interface UpdateProductData {
  name?: string;
  slug?: string;
  description?: string;
  short_description?: string;
  product_type?: string;
  brand_id?: number | null;
  published_status?: string;
  is_active?: boolean;
  is_featured?: boolean;
  is_upcoming?: boolean;
  call_for_price?: boolean;
  sort_order?: number;
  meta_title?: string;
  meta_description?: string;
  categories?: number[];
  images?: File[];
  variants?: UpdateProductVariantData[];
}

export interface UpdatePricingData {
  variants: Array<{
    id: number;
    price: number;
    compare_at_price?: number | null;
    cost_price?: number | null;
    currency?: string;
  }>;
}

export interface UpdateInventoryData {
  variants: Array<{
    id: number;
    track_stock: boolean;
    allow_backorder: boolean;
  }>;
}

export interface SyncAttributesData {
  attribute_values: number[];
}

// ========================================
// API Functions
// ========================================

/**
 * Get a paginated list of all products
 * Requires: admin or super_admin role
 */
export async function getProducts(
  token: string,
  params?: ProductListParams
): Promise<ProductListResponse> {
  const response = await api.get("/admin/products", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single product by ID
 * Requires: admin or super_admin role
 */
export async function getProduct(
  token: string,
  id: number,
  params?: { with_variants?: boolean; with_inventory?: boolean }
): Promise<{ data: Product }> {
  const response = await api.get(`/admin/products/${id}`, {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Create a new product with variants, categories, and images
 * Requires: admin or super_admin role
 */
export async function createProduct(
  token: string,
  data: CreateProductData,
  images?: File[]
): Promise<{ data: Product }> {
  const formData = new FormData();

  // Add basic fields (name and product_type are required)
  formData.append("name", data.name);
  if (data.slug) formData.append("slug", data.slug);
  if (data.description) formData.append("description", data.description);
  if (data.short_description)
    formData.append("short_description", data.short_description);
  formData.append("product_type", data.product_type);
  if (data.brand_id) formData.append("brand_id", String(data.brand_id));
  if (data.published_status) {
    formData.append("published_status", data.published_status);
  }
  if (data.is_active !== undefined) {
    formData.append("is_active", data.is_active ? "1" : "0");
  }
  if (data.is_featured !== undefined) {
    formData.append("is_featured", data.is_featured ? "1" : "0");
  }
  if (data.is_upcoming !== undefined) {
    formData.append("is_upcoming", data.is_upcoming ? "1" : "0");
  }
  if (data.call_for_price !== undefined) {
    formData.append("call_for_price", data.call_for_price ? "1" : "0");
  }
  if (data.sort_order !== undefined) {
    formData.append("sort_order", String(data.sort_order));
  }
  if (data.meta_title) formData.append("meta_title", data.meta_title);
  if (data.meta_description)
    formData.append("meta_description", data.meta_description);

  // Add categories array
  if (data.categories && data.categories.length > 0) {
    data.categories.forEach((categoryId) => {
      formData.append("categories[]", String(categoryId));
    });
  }

  // Add variants as JSON (complex nested structure)
  if (data.variants && data.variants.length > 0) {
    formData.append("variants", JSON.stringify(data.variants));
  }

  // Add images - use separate parameter to avoid serialization issues
  // Use images from parameter if provided, otherwise fall back to data.images
  const filesToUpload = images || data.images || [];

  if (filesToUpload.length > 0) {
    // Filter and validate files - ensure they are actual File objects
    const validFiles = filesToUpload.filter(
      (file) => file instanceof File && file.size > 0
    );

    console.log(
      "Appending images to FormData:",
      validFiles.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        constructor: f.constructor.name,
      }))
    );

    // Append each file with images[] key for Laravel array parsing
    validFiles.forEach((file) => {
      formData.append("images[]", file, file.name);
    });

    if (validFiles.length !== filesToUpload.length) {
      console.warn("Some image files were invalid and skipped");
    }
  }

  // Debug: Verify FormData has files
  const formDataFiles = Array.from(formData.entries())
    .filter(([key]) => key === "images[]")
    .map(([, value]) => value);

  console.log("FormData files count:", formDataFiles.length);
  console.log(
    "FormData file types:",
    formDataFiles.map((f) =>
      f instanceof File
        ? { name: f.name, size: f.size, type: f.type }
        : { type: typeof f, value: String(f).substring(0, 50) }
    )
  );

  const response = await api.post("/admin/products", formData, {
    headers: {
      ...getFormDataHeaders(token),
      // Don't set Content-Type - let axios set it with boundary automatically
    },
    // Ensure axios doesn't try to serialize FormData as JSON
    transformRequest: [
      (data) => {
        // Return FormData as-is, don't transform it
        if (data instanceof FormData) {
          return data;
        }
        return data;
      },
    ],
    // Override any default transformRequest from axios config
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return response.data;
}

/**
 * Update an existing product
 * Requires: admin or super_admin role
 */
export async function updateProduct(
  token: string,
  id: number,
  data: UpdateProductData,
  images?: File[]
): Promise<{ data: Product }> {
  const formData = new FormData();

  // ALWAYS add all fields explicitly - don't check for undefined
  // The frontend should always send all fields
  formData.append("name", data.name || "");
  if (data.slug !== undefined) formData.append("slug", data.slug || "");
  if (data.description !== undefined)
    formData.append("description", data.description || "");
  if (data.short_description !== undefined)
    formData.append("short_description", data.short_description || "");
  formData.append("product_type", data.product_type || "simple");
  if (data.brand_id !== undefined)
    formData.append("brand_id", data.brand_id ? String(data.brand_id) : "");
  if (data.published_status !== undefined)
    formData.append("published_status", data.published_status || "draft");
  // Send booleans as "1" or "0" for Laravel compatibility - always send is_active
  formData.append(
    "is_active",
    (data.is_active !== undefined ? data.is_active : true) ? "1" : "0"
  );
  // Send is_featured as "1" or "0" for Laravel compatibility
  if (data.is_featured !== undefined)
    formData.append("is_featured", data.is_featured ? "1" : "0");
  // Send is_upcoming as "1" or "0" for Laravel compatibility
  if (data.is_upcoming !== undefined)
    formData.append("is_upcoming", data.is_upcoming ? "1" : "0");
  // Send call_for_price as "1" or "0" for Laravel compatibility
  if (data.call_for_price !== undefined)
    formData.append("call_for_price", data.call_for_price ? "1" : "0");
  if (data.sort_order !== undefined)
    formData.append("sort_order", String(data.sort_order));
  if (data.meta_title !== undefined)
    formData.append("meta_title", data.meta_title || "");
  if (data.meta_description !== undefined)
    formData.append("meta_description", data.meta_description || "");

  // Add categories array if provided
  // If categories is undefined, don't send it (backend won't update categories)
  // If categories is an array (even empty), send it to update/sync categories
  if (data.categories !== undefined) {
    data.categories.forEach((categoryId) => {
      formData.append("categories[]", String(categoryId));
    });
  }

  // Add variants as JSON (complex nested structure)
  if (data.variants) {
    formData.append("variants", JSON.stringify(data.variants));
  }

  // Add images - use separate parameter to avoid serialization issues
  // Use images from parameter if provided, otherwise fall back to data.images
  const filesToUpload = images || data.images || [];

  if (filesToUpload.length > 0) {
    // Filter and validate files - ensure they are actual File objects
    const validFiles = filesToUpload.filter(
      (file) => file instanceof File && file.size > 0
    );

    // Append each file with images[] key for Laravel array parsing
    validFiles.forEach((file) => {
      formData.append("images[]", file, file.name);
    });
  }

  // Laravel handles FormData better with POST + method spoofing than PUT
  // Add _method field for Laravel method spoofing
  formData.append("_method", "PUT");

  // Use POST with method spoofing - Laravel handles FormData better this way
  const response = await api.post(`/admin/products/${id}`, formData, {
    headers: {
      ...getFormDataHeaders(token),
      // Don't set Content-Type - let browser/axios set it automatically with boundary
    },
    // Ensure axios doesn't try to serialize FormData as JSON
    transformRequest: [
      (data, headers) => {
        // If it's FormData, delete Content-Type so browser sets it with boundary
        if (data instanceof FormData && headers) {
          delete headers["Content-Type"];
          return data;
        }
        return data;
      },
    ],
    // Override any default transformRequest from axios config
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return response.data;
}

/**
 * Delete a product
 * Requires: admin or super_admin role
 */
export async function deleteProduct(
  token: string,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/admin/products/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update pricing for product variants
 * Requires: admin or super_admin role
 */
export async function updateProductPricing(
  token: string,
  id: number,
  data: UpdatePricingData
): Promise<{ data: Product }> {
  const response = await api.put(`/admin/products/${id}/pricing`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update inventory settings for product variants
 * Requires: admin or super_admin role
 */
export async function updateProductInventory(
  token: string,
  id: number,
  data: UpdateInventoryData
): Promise<{ data: Product }> {
  const response = await api.put(`/admin/products/${id}/inventory`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Sync product attribute values (for filtering)
 * Requires: admin or super_admin role
 */
export async function syncProductAttributes(
  token: string,
  id: number,
  data: SyncAttributesData
): Promise<{ data: Product }> {
  const response = await api.put(`/admin/products/${id}/attributes`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

// ========================================
// Product Images API Functions
// ========================================

/**
 * Get all images for a product
 * Requires: admin or super_admin role
 */
export async function getProductImages(
  token: string,
  productId: number
): Promise<{ data: ProductImage[] }> {
  const response = await api.get(`/admin/products/${productId}/images`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Add a new image to a product
 * Requires: admin or super_admin role
 */
export async function addProductImage(
  token: string,
  productId: number,
  imageData: {
    url: string;
    alt_text?: string;
    position?: number;
    is_primary?: boolean;
  }
): Promise<{ data: ProductImage }> {
  const response = await api.post(
    `/admin/products/${productId}/images`,
    imageData,
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}

/**
 * Delete a product image
 * Requires: admin or super_admin role
 */
export async function deleteProductImage(
  token: string,
  productId: number,
  imageId: number
): Promise<{ message: string }> {
  const response = await api.delete(
    `/admin/products/${productId}/images/${imageId}`,
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}
