import assert from "node:assert/strict";
import test from "node:test";
import { INTERACTION_COLUMNS, QREL_COLUMNS, judgmentTsv, validateJudgments } from "../lib/demo-export.ts";
import type { JudgmentRow } from "../lib/study-types.ts";

test("exports the evaluator qrels header in the exact required order", () => {
  const rows: JudgmentRow[] = [
    { participant_id: "p1", query_id: "s_001", candidate_id: "a", grade: "3", role: "support", fold: "0" },
    { participant_id: "p1", query_id: "s_001", candidate_id: "b", grade: "0", role: "support", fold: "0" },
    { participant_id: "p1", query_id: "e_001", candidate_id: "c", grade: "2", role: "evaluation", fold: "0" },
  ];
  const tsv = judgmentTsv(rows);
  assert.equal(tsv.split("\n")[0], "participant_id\tquery_id\tcandidate_id\tgrade\trole\tfold");
  assert.deepEqual(QREL_COLUMNS, ["participant_id", "query_id", "candidate_id", "grade", "role", "fold"]);
  assert.equal(INTERACTION_COLUMNS.length, 18);
});

test("rejects a support query that is not one strict pair", () => {
  const rows: JudgmentRow[] = [
    { participant_id: "p1", query_id: "s_001", candidate_id: "a", grade: "2", role: "support", fold: "0" },
    { participant_id: "p1", query_id: "s_001", candidate_id: "b", grade: "2", role: "support", fold: "0" },
  ];
  assert.ok(validateJudgments(rows).some((error) => error.includes("two unequal grades")));
});

test("rejects duplicate qrels and fold leakage", () => {
  const duplicate: JudgmentRow = { participant_id: "p1", query_id: "e_001", candidate_id: "a", grade: "3", role: "evaluation", fold: "0" };
  const rows = [duplicate, duplicate, { ...duplicate, query_id: "e_002", fold: "1" }];
  const errors = validateJudgments(rows);
  assert.ok(errors.some((error) => error.includes("Duplicate")));
  assert.ok(errors.some((error) => error.includes("multiple folds")));
});
