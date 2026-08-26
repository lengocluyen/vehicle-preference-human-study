import type { PublicStudyGate } from "../study-types";

export const SOURCE_PROTOCOL_VERSION = "0.1-draft";
export const SOURCE_CONSENT_VERSION = "demo-interface-v1";
export const SOURCE_TASK_BUNDLE_SHA256 = "synthetic-demo-only";

type Environment = Record<string, string | undefined>;

export type GateDecision = PublicStudyGate & {
  reasons: string[];
};

const requiredLiveKeys = [
  "ETHICS_APPROVAL_ID",
  "STUDY_DATA_CONTROLLER",
  "STUDY_APPROVED_START_UTC",
  "STUDY_APPROVED_END_UTC",
  "STUDY_CONSENT_SHA256",
  "STUDY_WITHDRAWAL_HMAC_KEY",
] as const;

function isPlaceholder(value: string | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return !normalized || normalized.includes("insert") || normalized.includes("placeholder");
}

export function evaluateStudyGate(
  environment: Environment,
  now = new Date(),
): GateDecision {
  const mode = environment.STUDY_MODE === "live" ? "live" : "demo";
  const ethicsStatus = environment.ETHICS_STATUS ?? "PENDING";
  const protocolVersion = environment.STUDY_PROTOCOL_VERSION ?? SOURCE_PROTOCOL_VERSION;
  const consentVersion = environment.STUDY_CONSENT_VERSION ?? SOURCE_CONSENT_VERSION;
  const reasons: string[] = [];

  if (mode !== "live") reasons.push("The deployment is configured for a synthetic demonstration.");
  if (ethicsStatus !== "READY") reasons.push("Institutional ethics status is not READY.");
  if (protocolVersion !== SOURCE_PROTOCOL_VERSION || protocolVersion.toLowerCase().includes("draft")) {
    reasons.push("The approved protocol version is not frozen in the source.");
  }
  if (consentVersion !== SOURCE_CONSENT_VERSION || consentVersion.toLowerCase().includes("demo")) {
    reasons.push("The approved consent version is not frozen in the source.");
  }
  if (
    environment.STUDY_TASK_BUNDLE_SHA256 !== SOURCE_TASK_BUNDLE_SHA256 ||
    SOURCE_TASK_BUNDLE_SHA256.includes("synthetic")
  ) {
    reasons.push("The approved task-bundle hash is not frozen in the source.");
  }
  if (environment.STUDY_DEPLOYMENT_ENV !== "pilot") {
    reasons.push("The deployment environment is not the approved pilot environment.");
  }
  for (const key of requiredLiveKeys) {
    if (isPlaceholder(environment[key])) reasons.push(`${key} is missing or still a placeholder.`);
  }

  const start = Date.parse(environment.STUDY_APPROVED_START_UTC ?? "");
  const end = Date.parse(environment.STUDY_APPROVED_END_UTC ?? "");
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
    reasons.push("The approved collection window is invalid.");
  } else if (now.getTime() < start || now.getTime() > end) {
    reasons.push("The current time is outside the approved collection window.");
  }

  const collectionEnabled = reasons.length === 0;
  return {
    mode,
    collectionEnabled,
    ethicsStatus,
    protocolVersion,
    consentVersion,
    reasons,
    message: collectionEnabled
      ? "The approved pilot is open."
      : "Recruitment and research-data collection are closed. Synthetic interface testing is available.",
  };
}

export function currentStudyGate(): GateDecision {
  return evaluateStudyGate(process.env);
}
