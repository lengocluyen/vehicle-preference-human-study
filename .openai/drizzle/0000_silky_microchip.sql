CREATE TABLE `study_assignments` (
	`research_session_id` text NOT NULL,
	`sequence_index` integer NOT NULL,
	`task_id` text NOT NULL,
	`role` text NOT NULL,
	`query_id` text NOT NULL,
	`reference_id` text NOT NULL,
	`candidate_left_id` text NOT NULL,
	`candidate_right_id` text NOT NULL,
	`presentation_order` text NOT NULL,
	`repeat_id` text,
	`attention_check_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_assignments_session_sequence` ON `study_assignments` (`research_session_id`,`sequence_index`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_assignments_session_task` ON `study_assignments` (`research_session_id`,`task_id`);--> statement-breakpoint
CREATE TABLE `study_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`idempotency_key` text NOT NULL,
	`payload_sha256` text NOT NULL,
	`research_session_id` text NOT NULL,
	`sequence_index` integer NOT NULL,
	`task_id` text NOT NULL,
	`response_type` text NOT NULL,
	`selected_candidate_id` text,
	`grade` integer,
	`cannot_judge` integer NOT NULL,
	`reason_codes` text NOT NULL,
	`response_time_ms` integer NOT NULL,
	`timestamp_utc` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_events_idempotency_key_unique` ON `study_events` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_events_session_sequence` ON `study_events` (`research_session_id`,`sequence_index`);--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`auth_hash` text PRIMARY KEY NOT NULL,
	`participant_id` text NOT NULL,
	`research_session_id` text NOT NULL,
	`csrf_hash` text NOT NULL,
	`withdrawal_hash` text NOT NULL,
	`consent_version` text NOT NULL,
	`consent_sha256` text NOT NULL,
	`protocol_version` text NOT NULL,
	`task_bundle_sha256` text NOT NULL,
	`fold` integer NOT NULL,
	`next_sequence` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at_utc` text NOT NULL,
	`completed_at_utc` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `study_sessions_participant_id_unique` ON `study_sessions` (`participant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `study_sessions_research_session_id_unique` ON `study_sessions` (`research_session_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `study_sessions_withdrawal_hash_unique` ON `study_sessions` (`withdrawal_hash`);--> statement-breakpoint
CREATE TABLE `withdrawal_requests` (
	`request_id` text PRIMARY KEY NOT NULL,
	`withdrawal_hash` text NOT NULL,
	`requested_at_utc` text NOT NULL,
	`resolution` text DEFAULT 'quarantine_pending' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_withdrawal_hash` ON `withdrawal_requests` (`withdrawal_hash`);