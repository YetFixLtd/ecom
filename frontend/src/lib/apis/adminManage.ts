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

export interface Administrator {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string | null;
  role: "super_admin" | "admin" | "manager" | "staff" | "worker";
  is_active: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminListParams {
  page?: number;
  per_page?: number;
  role?: "super_admin" | "admin" | "manager" | "staff" | "worker";
  is_active?: boolean;
  search?: string;
}

export interface AdminListResponse {
  data: Administrator[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CreateAdminData {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: "super_admin" | "admin" | "manager" | "staff" | "worker";
  is_active?: boolean;
}

export interface UpdateAdminData {
  email?: string;
  password?: string;
  password_confirmation?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role?: "super_admin" | "admin" | "manager" | "staff" | "worker";
  is_active?: boolean;
}

// ========================================
// API Functions
// ========================================

/**
 * Get a paginated list of all administrators
 * Requires: super_admin role
 */
export async function getAdministrators(
  token: string,
  params?: AdminListParams
): Promise<AdminListResponse> {
  const response = await api.get("/admin/administrators", {
    headers: getAuthHeaders(token),
    params,
  });
  return response.data;
}

/**
 * Get a single administrator by ID
 * Requires: super_admin role
 */
export async function getAdministrator(
  token: string,
  id: number
): Promise<{ data: Administrator }> {
  const response = await api.get(`/admin/administrators/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Create a new administrator
 * Requires: super_admin role
 */
export async function createAdministrator(
  token: string,
  data: CreateAdminData
): Promise<{ message: string; data: Administrator }> {
  const response = await api.post("/admin/administrators", data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update an existing administrator
 * Requires: super_admin role
 * Note: Cannot change own role
 */
export async function updateAdministrator(
  token: string,
  id: number,
  data: UpdateAdminData
): Promise<{ message: string; data: Administrator }> {
  const response = await api.put(`/admin/administrators/${id}`, data, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Delete an administrator (soft delete)
 * Requires: super_admin role
 * Note: Cannot delete own account
 */
export async function deleteAdministrator(
  token: string,
  id: number
): Promise<{ message: string }> {
  const response = await api.delete(`/admin/administrators/${id}`, {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Activate an administrator account
 * Requires: super_admin role
 */
export async function activateAdministrator(
  token: string,
  id: number
): Promise<{ message: string; data: Administrator }> {
  const response = await api.post(
    `/admin/administrators/${id}/activate`,
    {},
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}

/**
 * Deactivate an administrator account
 * Requires: super_admin role
 * Note: Cannot deactivate own account
 * Note: Revokes all tokens for the deactivated admin
 */
export async function deactivateAdministrator(
  token: string,
  id: number
): Promise<{ message: string; data: Administrator }> {
  const response = await api.post(
    `/admin/administrators/${id}/deactivate`,
    {},
    {
      headers: getAuthHeaders(token),
    }
  );
  return response.data;
}

// ========================================
// Helper Functions
// ========================================

/**
 * Get role display name
 */
export function getRoleDisplayName(role: Administrator["role"]): string {
  const roleNames: Record<Administrator["role"], string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    manager: "Manager",
    staff: "Staff",
    worker: "Worker",
  };
  return roleNames[role] || role;
}

/**
 * Get role level (for comparison)
 */
export function getRoleLevel(role: Administrator["role"]): number {
  const roleLevels: Record<Administrator["role"], number> = {
    super_admin: 5,
    admin: 4,
    manager: 3,
    staff: 2,
    worker: 1,
  };
  return roleLevels[role] || 0;
}

/**
 * Check if a role has permission to manage another role
 */
export function canManageRole(
  currentRole: Administrator["role"],
  targetRole: Administrator["role"]
): boolean {
  return getRoleLevel(currentRole) > getRoleLevel(targetRole);
}

/**
 * Format admin full name
 */
export function getAdminFullName(admin: Administrator): string {
  return `${admin.first_name} ${admin.last_name}`.trim();
}

/**
 * Get status color class
 */
export function getStatusColorClass(isActive: boolean): string {
  return isActive ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
}

/**
 * Get role color class
 */
export function getRoleColorClass(role: Administrator["role"]): string {
  const roleColors: Record<Administrator["role"], string> = {
    super_admin: "text-purple-600 bg-purple-50",
    admin: "text-blue-600 bg-blue-50",
    manager: "text-indigo-600 bg-indigo-50",
    staff: "text-gray-600 bg-gray-50",
    worker: "text-slate-600 bg-slate-50",
  };
  return roleColors[role] || "text-gray-600 bg-gray-50";
}
