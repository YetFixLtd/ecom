import { NextResponse } from "next/server";
import { getCookieOptions, getAdminCookieName } from "@/lib/cookies";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const res = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as unknown as {
      data?: { token?: string };
    };

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    const token: string | undefined = data?.data?.token;
    if (!token) {
      return NextResponse.json(
        { message: "Invalid login response" },
        { status: 500 }
      );
    }

    const response = NextResponse.json(data, { status: 200 });
    const cookieName = getAdminCookieName();
    response.cookies.set(cookieName, token, {
      ...getCookieOptions(),
      // 7 days
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
