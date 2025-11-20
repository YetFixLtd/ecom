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

export interface Settings {
  site_name?: string;
  site_description?: string;
  site_logo_url?: string;
  site_favicon_url?: string;
}

export interface AdminSettings extends Settings {
  site_logo_path?: string;
  site_favicon_path?: string;
}

export interface UpdateSettingsData {
  site_name?: string;
  site_description?: string;
  logo?: File;
  favicon?: File;
  delete_logo?: boolean;
  delete_favicon?: boolean;
}

// ========================================
// Client API Functions
// ========================================

/**
 * Get public settings (no auth required)
 */
export async function getPublicSettings(): Promise<{ data: Settings }> {
  const response = await api.get("/settings");
  return response.data;
}

// ========================================
// Admin API Functions
// ========================================

/**
 * Get all settings (admin only)
 */
export async function getSettings(token: string): Promise<{ data: any }> {
  const response = await api.get("/admin/settings", {
    headers: getAuthHeaders(token),
  });
  return response.data;
}

/**
 * Update settings (admin only)
 */
export async function updateSettings(
  token: string,
  data: UpdateSettingsData
): Promise<{ message: string; data: Settings }> {
  const formData = new FormData();

  // Append text fields
  if (data.site_name !== undefined) {
    formData.append("site_name", data.site_name);
  }
  if (data.site_description !== undefined) {
    formData.append("site_description", data.site_description);
  }

  // Append files
  if (data.logo) {
    formData.append("logo", data.logo);
  }
  if (data.favicon) {
    formData.append("favicon", data.favicon);
  }

  // Append delete flags
  if (data.delete_logo) {
    formData.append("delete_logo", "1");
  }
  if (data.delete_favicon) {
    formData.append("delete_favicon", "1");
  }

  const response = await api.post("/admin/settings", formData, {
    headers: {
      ...getAuthHeaders(token),
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

