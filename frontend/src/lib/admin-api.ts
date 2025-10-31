import type { Administrator, AdministratorListResponse } from "@/types/admin";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function getAdminToken(): Promise<string | undefined> {
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      const token = store.get("admin_token")?.value || undefined;
      return token;
    } catch (error) {
      return undefined;
    }
  }
  try {
    const m = document.cookie.match(/(?:^|; )admin_token=([^;]+)/);
    const token = m ? decodeURIComponent(m[1]) : undefined;
    if (!token) {
      console.warn(
        "⚠️ Admin token not found in cookies. Please log in at /admin/login"
      );
      console.log("Available cookies:", document.cookie);
    }
    return token;
  } catch (error) {
    console.error("Error reading admin token:", error);
    return undefined;
  }
}

export async function adminApiFetch<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const token = await getAdminToken();
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "Content-Type": "application/json",
  };

  console.log("token", token);
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_URL}${input.startsWith("/") ? "" : "/"}${input}`;

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let errorData: {
      message?: string;
      errors?: Record<string, string[]>;
    } | null = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: await response.text().catch(() => "") };
    }
    const error = new Error(
      errorData?.message || `Request failed with status ${response.status}`
    ) as Error & { status?: number; errors?: Record<string, string[]> };
    error.status = response.status;
    error.errors = errorData?.errors;
    throw error;
  }

  return (await response.json()) as T;
}

export type CreateAdministratorPayload = {
  email: string;
  password: string;
  password_confirmation: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  is_active?: boolean;
};

export type UpdateAdministratorPayload = Partial<{
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  is_active: boolean;
}>;

export async function listAdministrators(params: Record<string, unknown> = {}) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ) as Record<string, string>
  ).toString();
  return adminApiFetch<AdministratorListResponse>(
    `/admin/administrators${qs ? `?${qs}` : ""}`
  );
}

export async function getAdministrator(id: number | string) {
  return adminApiFetch<{ data: Administrator }>(`/admin/administrators/${id}`);
}

export async function createAdministrator(payload: CreateAdministratorPayload) {
  return adminApiFetch<{ message: string; data: Administrator }>(
    "/admin/administrators",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function updateAdministrator(
  id: number | string,
  payload: UpdateAdministratorPayload
) {
  return adminApiFetch<{ message: string; data: Administrator }>(
    `/admin/administrators/${id}`,
    { method: "PUT", body: JSON.stringify(payload) }
  );
}

export async function deleteAdministrator(id: number | string) {
  return adminApiFetch<{ message: string }>(`/admin/administrators/${id}`, {
    method: "DELETE",
  });
}

export async function activateAdministrator(id: number | string) {
  return adminApiFetch<{ message: string; data: { is_active: true } }>(
    `/admin/administrators/${id}/activate`,
    { method: "POST" }
  );
}

export async function deactivateAdministrator(id: number | string) {
  return adminApiFetch<{ message: string; data: { is_active: false } }>(
    `/admin/administrators/${id}/deactivate`,
    { method: "POST" }
  );
}
