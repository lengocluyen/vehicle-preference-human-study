import { NextRequest, NextResponse } from "next/server";
import { ensureStudySchema, getDatabase } from "@/lib/server/database";
import { hmacSha256Hex, randomHex } from "@/lib/server/crypto";
import { hasOnlyKeys, isSameOrigin, strictJson } from "@/lib/server/request-security";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "origin_rejected" }, { status: 403 });
  const body = await strictJson(request, 1024);
  if (!body || !hasOnlyKeys(body, ["withdrawalCode"]) || typeof body.withdrawalCode !== "string" || !/^W-[A-F0-9]{24}$/.test(body.withdrawalCode)) {
    return NextResponse.json({ accepted: true }, { status: 202 });
  }
  const secret = process.env.STUDY_WITHDRAWAL_HMAC_KEY ?? "";
  if (!secret) return NextResponse.json({ error: "withdrawal_service_unavailable" }, { status: 503 });
  const withdrawalHash = await hmacSha256Hex(secret, body.withdrawalCode);
  const database = getDatabase();
  await ensureStudySchema(database);
  const now = new Date().toISOString();
  await database.batch([
    database.prepare(
      "INSERT INTO withdrawal_requests (request_id, withdrawal_hash, requested_at_utc, resolution) VALUES (?, ?, ?, 'quarantine_pending')",
    ).bind(`wd_${randomHex(16)}`, withdrawalHash, now),
    database.prepare(
      "UPDATE study_sessions SET status = 'withdrawn' WHERE withdrawal_hash = ? AND status IN ('active','complete')",
    ).bind(withdrawalHash),
  ]);
  return NextResponse.json({ accepted: true }, { status: 202 });
}
