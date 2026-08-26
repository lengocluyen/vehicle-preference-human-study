import { NextRequest, NextResponse } from "next/server";
import { ensureStudySchema, getDatabase } from "@/lib/server/database";
import { hmacSha256Hex, randomHex, sha256Hex } from "@/lib/server/crypto";
import { LIVE_TASK_BUNDLE } from "@/lib/server/live-task-bundle";
import { hasOnlyKeys, isSameOrigin, strictJson } from "@/lib/server/request-security";
import { currentStudyGate } from "@/lib/server/study-gate";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const gate = currentStudyGate();
  if (!gate.collectionEnabled) return NextResponse.json({ error: "collection_closed" }, { status: 403 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "origin_rejected" }, { status: 403 });
  if (!LIVE_TASK_BUNDLE) return NextResponse.json({ error: "approved_task_bundle_unavailable" }, { status: 503 });

  const body = await strictJson(request);
  if (!body || !hasOnlyKeys(body, ["eligible", "consent", "consentVersion"])) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (body.eligible !== true || body.consent !== true || body.consentVersion !== gate.consentVersion) {
    return NextResponse.json({ error: "consent_not_recorded" }, { status: 400 });
  }

  const withdrawalSecret = process.env.STUDY_WITHDRAWAL_HMAC_KEY ?? "";
  if (!withdrawalSecret) return NextResponse.json({ error: "server_configuration_incomplete" }, { status: 503 });

  const authToken = randomHex(24);
  const csrfToken = randomHex(24);
  const participantId = `p_${randomHex(16)}`;
  const researchSessionId = `sess_${randomHex(16)}`;
  const withdrawalCode = `W-${randomHex(12).toUpperCase()}`;
  const fold = Number.parseInt(randomHex(4), 16) % 5;
  const now = new Date().toISOString();
  const authHash = await sha256Hex(authToken);
  const csrfHash = await sha256Hex(csrfToken);
  const withdrawalHash = await hmacSha256Hex(withdrawalSecret, withdrawalCode);
  const database = getDatabase();
  await ensureStudySchema(database);

  const statements = [database.prepare(
    `INSERT INTO study_sessions (
      auth_hash, participant_id, research_session_id, csrf_hash, withdrawal_hash,
      consent_version, consent_sha256, protocol_version, task_bundle_sha256,
      fold, next_sequence, status, created_at_utc
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active', ?)`,
  ).bind(
    authHash,
    participantId,
    researchSessionId,
    csrfHash,
    withdrawalHash,
    gate.consentVersion,
    process.env.STUDY_CONSENT_SHA256,
    gate.protocolVersion,
    LIVE_TASK_BUNDLE.sha256,
    fold,
    now,
  )];

  for (const [sequence, task] of LIVE_TASK_BUNDLE.tasks.entries()) {
    const swap = Number.parseInt(randomHex(1), 16) % 2 === 1;
    const left = swap ? task.candidateRightId : task.candidateLeftId;
    const right = swap ? task.candidateLeftId : task.candidateRightId;
    statements.push(database.prepare(
      `INSERT INTO study_assignments (
        research_session_id, sequence_index, task_id, role, query_id, reference_id,
        candidate_left_id, candidate_right_id, presentation_order, repeat_id, attention_check_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      researchSessionId,
      sequence,
      task.taskId,
      task.role,
      task.queryId,
      task.referenceId,
      left,
      right,
      `${left}|${right}`,
      task.repeatId ?? null,
      task.attentionCheckId ?? null,
    ));
  }
  await database.batch(statements);

  const response = NextResponse.json({
    csrfToken,
    withdrawalCode,
    consentVersion: gate.consentVersion,
    taskCount: LIVE_TASK_BUNDLE.tasks.length,
  }, { status: 201 });
  response.cookies.set("vsp_auth", authToken, {
    httpOnly: true,
    secure: new URL(request.url).protocol === "https:",
    sameSite: "strict",
    path: "/",
    maxAge: 4 * 60 * 60,
  });
  return response;
}
