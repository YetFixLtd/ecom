import { cookies } from "next/headers";

const ADMIN_TOKEN_COOKIE = "admin_token";

export async function getAdminTokenFromCookies(): Promise<string | undefined> {
  try {
    if (typeof window === "undefined") {
      const store = await cookies();
      return store.get(ADMIN_TOKEN_COOKIE)?.value || undefined;
    }
    const m = document.cookie.match(/(?:^|; )admin_token=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : undefined;
  } catch {
    return undefined;
  }
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
