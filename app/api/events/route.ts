import { NextRequest, NextResponse } from "next/server";
import { controlledReasons } from "@/lib/demo-tasks";
import { ensureStudySchema, getDatabase } from "@/lib/server/database";
import { randomHex, sha256Hex } from "@/lib/server/crypto";
import { hasOnlyKeys, isSameOrigin, strictJson } from "@/lib/server/request-security";
import { currentStudyGate } from "@/lib/server/study-gate";

export const dynamic = "force-dynamic";

type SessionRow = { research_session_id: string; csrf_hash: string; next_sequence: number; status: string };
type AssignmentRow = {
  task_id: string; role: string; candidate_left_id: string; candidate_right_id: string;
};
type ExistingEvent = { payload_sha256: string };

const allowedReasons = new Set<string>(controlledReasons.map(([code]) => code));

export async function POST(request: NextRequest) {
  const gate = currentStudyGate();
  if (!gate.collectionEnabled) return NextResponse.json({ error: "collection_closed" }, { status: 403 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "origin_rejected" }, { status: 403 });

  const authToken = request.cookies.get("vsp_auth")?.value ?? "";
  const csrfToken = request.headers.get("x-study-csrf") ?? "";
  if (!authToken || !csrfToken) return NextResponse.json({ error: "session_required" }, { status: 401 });

  const body = await strictJson(request);
  if (!body || !hasOnlyKeys(body, ["idempotencyKey", "taskId", "response", "reasonCodes", "responseTimeMs"])) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  if (typeof body.idempotencyKey !== "string" || !/^[A-Za-z0-9_.-]{16,128}$/.test(body.idempotencyKey)) {
    return NextResponse.json({ error: "invalid_idempotency_key" }, { status: 400 });
  }
  if (typeof body.taskId !== "string" || body.taskId.length > 120) return NextResponse.json({ error: "invalid_task" }, { status: 400 });
  const reasonCodes = Array.isArray(body.reasonCodes) ? [...new Set(body.reasonCodes)] : [];
  if (reasonCodes.length > 5 || reasonCodes.some((code) => typeof code !== "string" || !allowedReasons.has(code))) {
    return NextResponse.json({ error: "invalid_reason_codes" }, { status: 400 });
  }
  if (!Number.isInteger(body.responseTimeMs) || Number(body.responseTimeMs) < 0 || Number(body.responseTimeMs) > 86_400_000) {
    return NextResponse.json({ error: "invalid_response_time" }, { status: 400 });
  }

  const authHash = await sha256Hex(authToken);
  const csrfHash = await sha256Hex(csrfToken);
  const database = getDatabase();
  await ensureStudySchema(database);
  const session = await database.prepare(
    "SELECT research_session_id, csrf_hash, next_sequence, status FROM study_sessions WHERE auth_hash = ?",
  ).bind(authHash).first<SessionRow>();
  if (!session || session.status !== "active" || session.csrf_hash !== csrfHash) {
    return NextResponse.json({ error: "session_rejected" }, { status: 401 });
  }
  const assignment = await database.prepare(
    `SELECT task_id, role, candidate_left_id, candidate_right_id
     FROM study_assignments WHERE research_session_id = ? AND sequence_index = ?`,
  ).bind(session.research_session_id, session.next_sequence).first<AssignmentRow>();
  if (!assignment || assignment.task_id !== body.taskId) return NextResponse.json({ error: "workflow_conflict" }, { status: 409 });

  let responseType = "";
  let selectedCandidateId: string | null = null;
  let grade: number | null = null;
  let cannotJudge = 0;
  if (assignment.role === "support") {
    if (body.response === "left") selectedCandidateId = assignment.candidate_left_id;
    else if (body.response === "right") selectedCandidateId = assignment.candidate_right_id;
    else if (body.response === "cannot") cannotJudge = 1;
    else return NextResponse.json({ error: "invalid_support_response" }, { status: 400 });
    responseType = cannotJudge ? "cannot_judge" : "pairwise_choice";
  } else if (assignment.role === "evaluation") {
    if (body.response === "cannot") cannotJudge = 1;
    else if (Number.isInteger(body.response) && Number(body.response) >= 0 && Number(body.response) <= 3) {
      grade = Number(body.response);
      selectedCandidateId = assignment.candidate_right_id;
    } else return NextResponse.json({ error: "invalid_evaluation_response" }, { status: 400 });
    responseType = cannotJudge ? "cannot_judge" : "graded_relevance";
  } else {
    return NextResponse.json({ error: "unsupported_live_task_role" }, { status: 400 });
  }

  const normalized = JSON.stringify({
    taskId: body.taskId,
    response: body.response,
    reasonCodes: reasonCodes.sort(),
    responseTimeMs: body.responseTimeMs,
  });
  const payloadHash = await sha256Hex(normalized);
  const existing = await database.prepare(
    "SELECT payload_sha256 FROM study_events WHERE idempotency_key = ?",
  ).bind(body.idempotencyKey).first<ExistingEvent>();
  if (existing) {
    return existing.payload_sha256 === payloadHash
      ? NextResponse.json({ accepted: true, idempotentReplay: true })
      : NextResponse.json({ error: "conflicting_idempotency_replay" }, { status: 409 });
  }

  const nextSequence = session.next_sequence + 1;
  const now = new Date().toISOString();
  await database.batch([
    database.prepare(
      `INSERT INTO study_events (
        event_id, idempotency_key, payload_sha256, research_session_id, sequence_index,
        task_id, response_type, selected_candidate_id, grade, cannot_judge,
        reason_codes, response_time_ms, timestamp_utc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      `evt_${randomHex(16)}`,
      body.idempotencyKey,
      payloadHash,
      session.research_session_id,
      session.next_sequence,
      assignment.task_id,
      responseType,
      selectedCandidateId,
      grade,
      cannotJudge,
      reasonCodes.join("|"),
      body.responseTimeMs,
      now,
    ),
    database.prepare(
      "UPDATE study_sessions SET next_sequence = ? WHERE research_session_id = ? AND next_sequence = ? AND status = 'active'",
    ).bind(nextSequence, session.research_session_id, session.next_sequence),
  ]);
  return NextResponse.json({ accepted: true, nextSequence });
}
