import process from "node:process";
import { type NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "http://localhost:8080";

async function proxy(
  req: NextRequest,
  { params }: { params: { path: string[] } }
): Promise<NextResponse> {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const token = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("bankops_token="))
    ?.split("=")[1];

  const url       = new URL(req.url);
  const path      = "/" + params.path.join("/");
  const targetUrl = `${BACKEND}/api/v1${path}${url.search}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? await req.text()
      : undefined;

  const backendRes = await fetch(targetUrl, {
    method:  req.method,
    headers,
    body,
    cache:   "no-store",
  });

  const responseBody = await backendRes.text();

  return new NextResponse(responseBody, {
    status:  backendRes.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET    = proxy;
export const POST   = proxy;
export const PUT    = proxy;
export const PATCH  = proxy;
export const DELETE = proxy;