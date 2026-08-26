import type { NextRequest } from "next/server";

export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return Object.keys(value).every((key) => allowedSet.has(key));
}

export async function strictJson(request: NextRequest, maximumBytes = 4096): Promise<Record<string, unknown> | null> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maximumBytes) return null;
  try {
    const value: unknown = await request.json();
    if (!value || Array.isArray(value) || typeof value !== "object") return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}
