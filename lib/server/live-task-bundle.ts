export type LiveTask = {
  taskId: string;
  role: "practice" | "support" | "evaluation" | "feedback";
  queryId: string;
  referenceId: string;
  candidateLeftId: string;
  candidateRightId: string;
  repeatId?: string;
  attentionCheckId?: string;
};

export type LiveTaskBundle = { sha256: string; tasks: LiveTask[] };

// This intentionally remains null until an approved, licence-cleared, frozen
// task bundle has been generated and its SHA-256 is bound to the ethics record.
export const LIVE_TASK_BUNDLE: LiveTaskBundle | null = null;
