/**
 * POST /api/auth/login
 *
 * Proxies login requests to the Java backend and sets a secure
 * HttpOnly cookie containing the JWT. The browser never has direct
 * access to the token value, mitigating XSS-based token theft.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

interface LoginPayload {
  username: string;
  password: string;
}

interface BackendLoginResponse {
  token: string;
  username: string;
  role: string;
  expiresInSeconds: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let payload: LoginPayload;
  try {
    payload = (await req.json()) as LoginPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Basic server-side validation before forwarding
  if (
    typeof payload.username !== "string" ||
    typeof payload.password !== "string" ||
    payload.username.length < 3 ||
    payload.password.length < 8
  ) {
    return NextResponse.json({ error: "Invalid credentials format" }, { status: 422 });
  }

  let backendResponse: Response;
  try {
    backendResponse = await fetch(`${BACKEND}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication service unavailable" },
      { status: 503 }
    );
  }

  if (!backendResponse.ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const data = (await backendResponse.json()) as BackendLoginResponse;

  // Set JWT as HttpOnly cookie — inaccessible to JavaScript (XSS protection)
  const response = NextResponse.json({
    username: data.username,
    role: data.role,
    expiresInSeconds: data.expiresInSeconds,
  });

  response.cookies.set("bankops_token", data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: data.expiresInSeconds,
    path: "/",
  });

  return response;
}
