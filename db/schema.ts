import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const studySessions = sqliteTable("study_sessions", {
  authHash: text("auth_hash").primaryKey(),
  participantId: text("participant_id").notNull().unique(),
  researchSessionId: text("research_session_id").notNull().unique(),
  csrfHash: text("csrf_hash").notNull(),
  withdrawalHash: text("withdrawal_hash").notNull().unique(),
  consentVersion: text("consent_version").notNull(),
  consentSha256: text("consent_sha256").notNull(),
  protocolVersion: text("protocol_version").notNull(),
  taskBundleSha256: text("task_bundle_sha256").notNull(),
  fold: integer("fold").notNull(),
  nextSequence: integer("next_sequence").notNull().default(0),
  status: text("status").notNull().default("active"),
  createdAtUtc: text("created_at_utc").notNull(),
  completedAtUtc: text("completed_at_utc"),
});

export const studyAssignments = sqliteTable("study_assignments", {
  researchSessionId: text("research_session_id").notNull(),
  sequenceIndex: integer("sequence_index").notNull(),
  taskId: text("task_id").notNull(),
  role: text("role").notNull(),
  queryId: text("query_id").notNull(),
  referenceId: text("reference_id").notNull(),
  candidateLeftId: text("candidate_left_id").notNull(),
  candidateRightId: text("candidate_right_id").notNull(),
  presentationOrder: text("presentation_order").notNull(),
  repeatId: text("repeat_id"),
  attentionCheckId: text("attention_check_id"),
}, (table) => [
  uniqueIndex("idx_assignments_session_sequence").on(table.researchSessionId, table.sequenceIndex),
  uniqueIndex("idx_assignments_session_task").on(table.researchSessionId, table.taskId),
]);

export const studyEvents = sqliteTable("study_events", {
  eventId: text("event_id").primaryKey(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  payloadSha256: text("payload_sha256").notNull(),
  researchSessionId: text("research_session_id").notNull(),
  sequenceIndex: integer("sequence_index").notNull(),
  taskId: text("task_id").notNull(),
  responseType: text("response_type").notNull(),
  selectedCandidateId: text("selected_candidate_id"),
  grade: integer("grade"),
  cannotJudge: integer("cannot_judge", { mode: "boolean" }).notNull(),
  reasonCodes: text("reason_codes").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  timestampUtc: text("timestamp_utc").notNull(),
}, (table) => [
  index("idx_events_session_sequence").on(table.researchSessionId, table.sequenceIndex),
]);

export const withdrawalRequests = sqliteTable("withdrawal_requests", {
  requestId: text("request_id").primaryKey(),
  withdrawalHash: text("withdrawal_hash").notNull(),
  requestedAtUtc: text("requested_at_utc").notNull(),
  resolution: text("resolution").notNull().default("quarantine_pending"),
}, (table) => [index("idx_withdrawal_hash").on(table.withdrawalHash)]);
