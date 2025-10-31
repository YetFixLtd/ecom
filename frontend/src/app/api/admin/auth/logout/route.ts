import { NextResponse } from "next/server";
import {
  getAdminTokenFromCookies,
  getAdminCookieName,
  getCookieOptions,
} from "@/lib/cookies";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST() {
  const token = await getAdminTokenFromCookies();

  try {
    if (token) {
      await fetch(`${API_URL}/admin/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => undefined);
    }

    const response = NextResponse.json(
      { message: "Logged out" },
      { status: 200 }
    );
    response.cookies.set(getAdminCookieName(), "", {
      ...getCookieOptions(),
      maxAge: 0,
    });
    return response;
  } catch {
    const response = NextResponse.json(
      { message: "Error during logout" },
      { status: 500 }
    );
    response.cookies.set(getAdminCookieName(), "", {
      ...getCookieOptions(),
      maxAge: 0,
    });
    return response;
  }
}
