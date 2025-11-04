import axios from "axios";
import { getAdminTokenFromCookies } from "@/lib/cookies";

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

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address1: string | null;
  address2: string | null;
  city: string | null;
  state_region: string | null;
  postal_code: string | null;
  country_code: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  variant_id: number;
  warehouse_id: number;
  on_hand: number;
  reserved: number;
  available: number;
  safety_stock: number;
  reorder_point: number;
  is_below_safety_stock: boolean;
  needs_reorder: boolean;
  variant?: {
    id: number;
    product_id: number;
    sku: string;
    price: number;
    product?: {
      id: number;
      name: string;
      slug: string;
    };
  };
  warehouse?: Warehouse;
  created_at: string;
  updated_at: string;
}

export interface TransferItem {
  id: number;
  transfer_id: number;
  variant_id: number;
  qty: number;
  variant?: {
    id: number;
    product_id: number;
    sku: string;
    price: number;
    product?: {
      id: number;
      name: string;
      slug: string;
    };
  };
}

export type TransferStatus = "draft" | "in_transit" | "received" | "canceled";

export interface Transfer {
  id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  status: TransferStatus;
  is_draft: boolean;
  is_in_transit: boolean;
  is_received: boolean;
  is_canceled: boolean;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  items?: TransferItem[];
  created_by?: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
}

export type AdjustmentMode = "SET_ON_HAND" | "DELTA_ON_HAND";

export interface InventoryAdjustment {
  id: number;
  variant_id: number;
  warehouse_id: number;
  adjustment_mode: AdjustmentMode;
  qty_before: number;
  qty_change: number;
  qty_after: number;
  unit_cost: number | null;
  reason_code: string | null;
  note: string | null;
  variant?: {
    id: number;
    product_id: number;
    sku: string;
    product?: {
      id: number;
      name: string;
      slug: string;
    };
  };
  warehouse?: Warehouse;
  performed_by?: {
    id: number;
    name: string;
    email: string;
  };
  performed_at: string;
  created_at: string;
}

export type MovementType =
  | "adjustment"
  | "transfer_in"
  | "transfer_out"
  | "reservation"
  | "release"
  | "sale"
  | "return"
  | "damaged"
  | "expired";

export interface InventoryMovement {
  id: number;
  variant_id: number;
  warehouse_id: number;
  qty_change: number;
  movement_type: MovementType;
  reference_type: string | null;
  reference_id: number | null;
  unit_cost: number | null;
  reason_code: string | null;
  note: string | null;
  is_incoming: boolean;
  is_outgoing: boolean;
  variant?: {
    id: number;
    product_id: number;
    sku: string;
    product?: {
      id: number;
      name: string;
      slug: string;
    };
  };
  warehouse?: Warehouse;
  performed_by?: {
    id: number;
    name: string;
    email: string;
  };
  performed_at: string;
  created_at: string;
}

// ========================================
// Request/Response Types
// ========================================

export interface WarehouseListParams {
  page?: number;
  size?: number;
  q?: string;
  is_default?: boolean;
  sort?: string;
}

export interface WarehouseListResponse {
  data: Warehouse[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateWarehouseData {
  name: string;
  code: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state_region?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  is_default?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;
  code?: string;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state_region?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  is_default?: boolean;
}

export interface InventoryItemListParams {
  page?: number;
  size?: number;
  variant_id?: number;
  warehouse_id?: number;
  q?: string;
  below_safety?: boolean;
  needs_reorder?: boolean;
  sort?: string;
}

export interface InventoryItemListResponse {
  data: InventoryItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface TransferListParams {
  page?: number;
  size?: number;
  status?: TransferStatus;
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  sort?: string;
}

export interface TransferListResponse {
  data: Transfer[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateTransferData {
  from_warehouse_id: number;
  to_warehouse_id: number;
  items: Array<{
    variant_id: number;
    qty: number;
  }>;
}

export interface UpdateTransferData {
  from_warehouse_id?: number;
  to_warehouse_id?: number;
  items?: Array<{
    variant_id: number;
    qty: number;
  }>;
}

export interface CreateAdjustmentData {
  variant_id: number;
  warehouse_id: number;
  adjustment_mode: AdjustmentMode;
  qty: number;
  unit_cost?: number | null;
  reason_code?: string | null;
  note?: string | null;
}

export interface ReservationData {
  variant_id: number;
  warehouse_id: number;
  qty: number;
  reference_type?: string | null;
  reference_id?: number | null;
  note?: string | null;
}

export interface ReservationResponse {
  message: string;
  inventory_item: {
    on_hand: number;
    reserved: number;
    available: number;
  };
}

export interface MovementListParams {
  page?: number;
  size?: number;
  variant_id?: number;
  warehouse_id?: number;
  movement_type?: MovementType;
  performed_by?: number;
  date_from?: string;
  date_to?: string;
  reference_type?: string;
  reference_id?: number;
  sort?: string;
}

export interface MovementListResponse {
  data: InventoryMovement[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ========================================
// API Functions - Warehouses
// ========================================

/**
 * Get a paginated list of all warehouses
 * Requires: admin or super_admin role
 */
export async function getWarehouses(
  params?: WarehouseListParams
): Promise<WarehouseListResponse> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/inventory/warehouses", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single warehouse by ID
 * Requires: admin or super_admin role
 */
export async function getWarehouse(id: number): Promise<{ data: Warehouse }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get(`/admin/inventory/warehouses/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a new warehouse
 * Requires: admin or super_admin role
 */
export async function createWarehouse(
  data: CreateWarehouseData
): Promise<{ data: Warehouse }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post("/admin/inventory/warehouses", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing warehouse
 * Requires: admin or super_admin role
 */
export async function updateWarehouse(
  id: number,
  data: UpdateWarehouseData
): Promise<{ data: Warehouse }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.put(`/admin/inventory/warehouses/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Delete a warehouse
 * Requires: admin or super_admin role
 * Note: Cannot delete warehouse with inventory items
 */
export async function deleteWarehouse(
  id: number
): Promise<{ message: string }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.delete(`/admin/inventory/warehouses/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

// ========================================
// API Functions - Inventory Items
// ========================================

/**
 * Get a paginated list of all inventory items
 * Requires: admin or super_admin role
 */
export async function getInventoryItems(
  params?: InventoryItemListParams
): Promise<InventoryItemListResponse> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/inventory/items", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single inventory item by ID
 * Requires: admin or super_admin role
 */
export async function getInventoryItem(
  id: number
): Promise<{ data: InventoryItem }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get(`/admin/inventory/items/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

// ========================================
// API Functions - Transfers
// ========================================

/**
 * Get a paginated list of all transfers
 * Requires: admin or super_admin role
 */
export async function getTransfers(
  params?: TransferListParams
): Promise<TransferListResponse> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/inventory/transfers", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single transfer by ID
 * Requires: admin or super_admin role
 */
export async function getTransfer(id: number): Promise<{ data: Transfer }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get(`/admin/inventory/transfers/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a new transfer (draft status)
 * Requires: admin or super_admin role
 */
export async function createTransfer(
  data: CreateTransferData
): Promise<{ data: Transfer }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post("/admin/inventory/transfers", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing transfer (only if draft)
 * Requires: admin or super_admin role
 */
export async function updateTransfer(
  id: number,
  data: UpdateTransferData
): Promise<{ data: Transfer }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.put(`/admin/inventory/transfers/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Dispatch a transfer (draft → in_transit)
 * Requires: admin or super_admin role
 */
export async function dispatchTransfer(
  id: number
): Promise<{ data: Transfer }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post(
    `/admin/inventory/transfers/${id}/dispatch`,
    {},
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}

/**
 * Receive a transfer (in_transit → received)
 * Requires: admin or super_admin role
 */
export async function receiveTransfer(id: number): Promise<{ data: Transfer }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post(
    `/admin/inventory/transfers/${id}/receive`,
    {},
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}

/**
 * Cancel a transfer (draft → canceled)
 * Requires: admin or super_admin role
 */
export async function cancelTransfer(id: number): Promise<{ data: Transfer }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post(
    `/admin/inventory/transfers/${id}/cancel`,
    {},
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}

// ========================================
// API Functions - Adjustments
// ========================================

/**
 * Create a stock adjustment
 * Requires: admin or super_admin role
 * Supports SET_ON_HAND and DELTA_ON_HAND modes
 */
export async function createAdjustment(
  data: CreateAdjustmentData
): Promise<{ data: InventoryAdjustment }> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post("/admin/inventory/adjustments", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

// ========================================
// API Functions - Reservations
// ========================================

/**
 * Reserve stock for an order or other reference
 * Requires: admin or super_admin role
 */
export async function reserveStock(
  data: ReservationData
): Promise<ReservationResponse> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post("/admin/inventory/reserve", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Release reserved stock
 * Requires: admin or super_admin role
 */
export async function releaseStock(
  data: ReservationData
): Promise<ReservationResponse> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.post("/admin/inventory/release", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

// ========================================
// API Functions - Movements
// ========================================

/**
 * Get a paginated list of all inventory movements
 * Requires: admin or super_admin role
 */
export async function getMovements(
  params?: MovementListParams
): Promise<MovementListResponse> {
  const token = await getAdminTokenFromCookies();
  if (!token) {
    throw new Error("Authentication token not found");
  }

  const response = await api.get("/admin/inventory/movements", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}
