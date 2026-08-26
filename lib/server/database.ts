import { env } from "cloudflare:workers";

export function getDatabase(): D1Database {
  if (!env.DB) throw new Error("The study database binding is unavailable.");
  return env.DB;
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS study_sessions (
    auth_hash TEXT PRIMARY KEY,
    participant_id TEXT NOT NULL UNIQUE,
    research_session_id TEXT NOT NULL UNIQUE,
    csrf_hash TEXT NOT NULL,
    withdrawal_hash TEXT NOT NULL UNIQUE,
    consent_version TEXT NOT NULL,
    consent_sha256 TEXT NOT NULL,
    protocol_version TEXT NOT NULL,
    task_bundle_sha256 TEXT NOT NULL,
    fold INTEGER NOT NULL CHECK (fold >= 0),
    next_sequence INTEGER NOT NULL DEFAULT 0 CHECK (next_sequence >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','complete','withdrawn','quarantined')),
    created_at_utc TEXT NOT NULL,
    completed_at_utc TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS study_assignments (
    research_session_id TEXT NOT NULL,
    sequence_index INTEGER NOT NULL CHECK (sequence_index >= 0),
    task_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('practice','support','evaluation','feedback')),
    query_id TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    candidate_left_id TEXT NOT NULL,
    candidate_right_id TEXT NOT NULL,
    presentation_order TEXT NOT NULL,
    repeat_id TEXT,
    attention_check_id TEXT,
    UNIQUE (research_session_id, sequence_index),
    UNIQUE (research_session_id, task_id)
  )`,
  `CREATE TABLE IF NOT EXISTS study_events (
    event_id TEXT PRIMARY KEY,
    idempotency_key TEXT NOT NULL UNIQUE,
    payload_sha256 TEXT NOT NULL,
    research_session_id TEXT NOT NULL,
    sequence_index INTEGER NOT NULL CHECK (sequence_index >= 0),
    task_id TEXT NOT NULL,
    response_type TEXT NOT NULL,
    selected_candidate_id TEXT,
    grade INTEGER CHECK (grade IS NULL OR grade BETWEEN 0 AND 3),
    cannot_judge INTEGER NOT NULL CHECK (cannot_judge IN (0,1)),
    reason_codes TEXT NOT NULL,
    response_time_ms INTEGER NOT NULL CHECK (response_time_ms BETWEEN 0 AND 86400000),
    timestamp_utc TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS withdrawal_requests (
    request_id TEXT PRIMARY KEY,
    withdrawal_hash TEXT NOT NULL,
    requested_at_utc TEXT NOT NULL,
    resolution TEXT NOT NULL DEFAULT 'quarantine_pending'
  )`,
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_session_sequence ON study_assignments(research_session_id, sequence_index)",
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_session_task ON study_assignments(research_session_id, task_id)",
  "CREATE INDEX IF NOT EXISTS idx_events_session_sequence ON study_events(research_session_id, sequence_index)",
  "CREATE INDEX IF NOT EXISTS idx_withdrawal_hash ON withdrawal_requests(withdrawal_hash)",
  `CREATE TRIGGER IF NOT EXISTS prevent_study_event_update
    BEFORE UPDATE ON study_events BEGIN SELECT RAISE(ABORT, 'study_events is append-only'); END`,
  `CREATE TRIGGER IF NOT EXISTS prevent_study_event_delete
    BEFORE DELETE ON study_events BEGIN SELECT RAISE(ABORT, 'study_events is append-only'); END`,
];

let initialized = false;

export async function ensureStudySchema(database = getDatabase()): Promise<void> {
  if (initialized) return;
  await database.batch(schemaStatements.map((statement) => database.prepare(statement)));
  await database.prepare("PRAGMA optimize").run();
  initialized = true;
}
