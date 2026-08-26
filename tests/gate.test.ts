import assert from "node:assert/strict";
import test from "node:test";
import { evaluateStudyGate } from "../lib/server/study-gate.ts";

test("missing configuration is a synthetic, fail-closed deployment", () => {
  const gate = evaluateStudyGate({}, new Date("2026-08-26T12:00:00Z"));
  assert.equal(gate.mode, "demo");
  assert.equal(gate.ethicsStatus, "PENDING");
  assert.equal(gate.collectionEnabled, false);
  assert.ok(gate.reasons.length > 3);
});

test("READY alone cannot bypass frozen-source controls", () => {
  const gate = evaluateStudyGate({
    STUDY_MODE: "live",
    ETHICS_STATUS: "READY",
    ETHICS_APPROVAL_ID: "IRB-123",
    STUDY_DATA_CONTROLLER: "Example University",
    STUDY_DEPLOYMENT_ENV: "pilot",
    STUDY_APPROVED_START_UTC: "2026-08-01T00:00:00Z",
    STUDY_APPROVED_END_UTC: "2026-09-01T00:00:00Z",
    STUDY_PROTOCOL_VERSION: "0.1-draft",
    STUDY_CONSENT_VERSION: "demo-interface-v1",
    STUDY_CONSENT_SHA256: "a".repeat(64),
    STUDY_TASK_BUNDLE_SHA256: "synthetic-demo-only",
    STUDY_WITHDRAWAL_HMAC_KEY: "test-only-secret",
  }, new Date("2026-08-26T12:00:00Z"));
  assert.equal(gate.collectionEnabled, false);
  assert.ok(gate.reasons.some((reason) => reason.includes("protocol")));
  assert.ok(gate.reasons.some((reason) => reason.includes("task-bundle")));
});

test("an invalid or expired collection window fails closed", () => {
  const gate = evaluateStudyGate({
    STUDY_MODE: "live",
    ETHICS_STATUS: "READY",
    STUDY_APPROVED_START_UTC: "2025-01-01T00:00:00Z",
    STUDY_APPROVED_END_UTC: "2025-02-01T00:00:00Z",
  }, new Date("2026-08-26T12:00:00Z"));
  assert.equal(gate.collectionEnabled, false);
  assert.ok(gate.reasons.some((reason) => reason.includes("outside")));
});
