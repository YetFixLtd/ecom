const ADMIN_TOKEN_COOKIE = "admin_token";

/**
 * Get admin token from cookies (works in both client and server components)
 * - Client: Returns Promise that resolves immediately with token from document.cookie
 * - Server: Returns Promise with token from next/headers cookies()
 */
export async function getAdminTokenFromCookies(): Promise<string | undefined> {
  // Server-side: Use next/headers
  if (typeof window === "undefined") {
    try {
      // Dynamic import to avoid bundling next/headers in client bundle
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      return cookieStore.get(ADMIN_TOKEN_COOKIE)?.value || undefined;
    } catch {
      return undefined;
    }
  }

  // Client-side: Use document.cookie (return immediately as resolved promise)
  try {
    const match = document.cookie.match(/(?:^|; )admin_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Set admin token in browser cookies (client-side only)
 */
export function setAdminTokenCookie(token: string, maxAge = 60 * 60 * 24 * 7) {
  if (typeof window === "undefined") return;
  document.cookie = `${ADMIN_TOKEN_COOKIE}=${token}; path=/; max-age=${maxAge}`;
}

/**
 * Delete admin token from browser cookies (client-side only)
 */
export function deleteAdminTokenCookie() {
  if (typeof window === "undefined") return;
  document.cookie = `${ADMIN_TOKEN_COOKIE}=; path=/; max-age=0`;
}

export function getAdminCookieName(): string {
  return ADMIN_TOKEN_COOKIE;
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: false as const, // Changed to false so JavaScript can access it
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}
