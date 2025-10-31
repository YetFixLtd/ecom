import { getAdminTokenFromCookies } from "@/lib/cookies";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function adminApiFetch<T = unknown>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const token = await getAdminTokenFromCookies();
  const headers: HeadersInit = {
    ...(init?.headers || {}),
    "Content-Type": "application/json",
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${API_URL}${input.startsWith("/") ? "" : "/"}${input}`,
    {
      ...init,
      headers,
      // Ensure server fetch where possible; adjust as needed per page requirements
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
