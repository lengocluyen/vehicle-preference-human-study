import type { InteractionRow, JudgmentRow } from "./study-types";

export const INTERACTION_COLUMNS = [
  "participant_id",
  "session_id",
  "consent_version",
  "query_id",
  "candidate_left_id",
  "candidate_right_id",
  "presentation_order",
  "response_type",
  "selected_candidate_id",
  "grade",
  "cannot_judge",
  "reason_codes",
  "response_time_ms",
  "role",
  "repeat_id",
  "attention_check_id",
  "fold",
  "timestamp_utc",
] as const satisfies readonly (keyof InteractionRow)[];

export const QREL_COLUMNS = [
  "participant_id",
  "query_id",
  "candidate_id",
  "grade",
  "role",
  "fold",
] as const satisfies readonly (keyof JudgmentRow)[];

const cleanCell = (value: unknown) =>
  String(value ?? "")
    .replace(/[\t\r\n]+/g, " ")
    .trim();

export function rowsToTsv<T extends object>(
  rows: readonly T[],
  columns: readonly (keyof T)[],
): string {
  const header = columns.join("\t");
  const body = rows.map((row) => columns.map((key) => cleanCell(row[key])).join("\t"));
  return `${[header, ...body].join("\n")}\n`;
}

export function validateJudgments(rows: readonly JudgmentRow[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const folds = new Map<string, string>();
  const support = new Map<string, JudgmentRow[]>();

  for (const row of rows) {
    if (!row.participant_id || !row.query_id || !row.candidate_id) {
      errors.push("Judgment identifiers must be non-empty.");
    }
    if (!["0", "1", "2", "3"].includes(row.grade)) {
      errors.push(`Invalid grade for ${row.query_id}/${row.candidate_id}.`);
    }
    if (!/^(0|[1-9]\d*)$/.test(row.fold)) {
      errors.push(`Invalid fold for participant ${row.participant_id}.`);
    }
    const priorFold = folds.get(row.participant_id);
    if (priorFold !== undefined && priorFold !== row.fold) {
      errors.push(`Participant ${row.participant_id} appears in multiple folds.`);
    }
    folds.set(row.participant_id, row.fold);

    const key = [row.participant_id, row.query_id, row.candidate_id, row.role].join("\u0000");
    if (seen.has(key)) errors.push(`Duplicate judgment for ${row.query_id}/${row.candidate_id}.`);
    seen.add(key);

    if (row.role === "support") {
      const group = `${row.participant_id}\u0000${row.query_id}`;
      support.set(group, [...(support.get(group) ?? []), row]);
    }
  }

  for (const [group, groupRows] of support) {
    if (groupRows.length !== 2 || new Set(groupRows.map((row) => row.grade)).size !== 2) {
      errors.push(`Support group ${group} must contain exactly two unequal grades.`);
    }
  }
  return [...new Set(errors)];
}

export function interactionTsv(rows: readonly InteractionRow[]): string {
  return rowsToTsv(rows, INTERACTION_COLUMNS);
}

export function judgmentTsv(rows: readonly JudgmentRow[]): string {
  const errors = validateJudgments(rows);
  if (errors.length) throw new Error(errors.join(" "));
  return rowsToTsv(rows, QREL_COLUMNS);
}
