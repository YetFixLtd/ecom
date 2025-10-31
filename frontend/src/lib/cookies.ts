import { cookies } from "next/headers";

const ADMIN_TOKEN_COOKIE = "admin_token";

export async function getAdminTokenFromCookies(): Promise<string | undefined> {
  try {
    const cookieStore = cookies() as unknown as {
      get: (name: string) => { value?: string } | undefined;
    };
    const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
    return token || undefined;
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
    httpOnly: true as const,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
  };
}
