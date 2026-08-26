export type VehicleValue = string | number | null;

export type VehicleListing = {
  id: string;
  label: string;
  values: Record<string, VehicleValue>;
};

export type PairwiseTask = {
  taskId: string;
  queryId: string;
  reference: VehicleListing;
  candidateA: VehicleListing;
  candidateB: VehicleListing;
};

export type EvaluationTask = {
  taskId: string;
  queryId: string;
  reference: VehicleListing;
  candidate: VehicleListing;
  repeatId?: string;
  attentionCheckId?: string;
};

export type InteractionRow = {
  participant_id: string;
  session_id: string;
  consent_version: string;
  query_id: string;
  candidate_left_id: string;
  candidate_right_id: string;
  presentation_order: string;
  response_type: string;
  selected_candidate_id: string;
  grade: string;
  cannot_judge: string;
  reason_codes: string;
  response_time_ms: string;
  role: string;
  repeat_id: string;
  attention_check_id: string;
  fold: string;
  timestamp_utc: string;
};

export type JudgmentRow = {
  participant_id: string;
  query_id: string;
  candidate_id: string;
  grade: string;
  role: "support" | "evaluation";
  fold: string;
};

export type PublicStudyGate = {
  mode: "demo" | "live";
  collectionEnabled: boolean;
  ethicsStatus: string;
  protocolVersion: string;
  consentVersion: string;
  message: string;
};
