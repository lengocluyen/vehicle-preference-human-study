import { NextResponse } from "next/server";
import { currentStudyGate } from "@/lib/server/study-gate";

export const dynamic = "force-dynamic";

export function GET() {
  const gate = currentStudyGate();
  return NextResponse.json({
    mode: gate.mode,
    collectionEnabled: gate.collectionEnabled,
    ethicsStatus: gate.ethicsStatus,
    protocolVersion: gate.protocolVersion,
    consentVersion: gate.consentVersion,
    message: gate.message,
  }, { headers: { "Cache-Control": "no-store" } });
}
