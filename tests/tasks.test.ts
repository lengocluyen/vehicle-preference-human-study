import assert from "node:assert/strict";
import test from "node:test";
import { demoEvaluationTasks, demoSupportTasks, practiceTopics } from "../lib/demo-tasks.ts";

test("support and evaluation query identifiers are disjoint", () => {
  const support = new Set(demoSupportTasks.map((task) => task.queryId));
  const evaluation = new Set(demoEvaluationTasks.map((task) => task.queryId));
  assert.deepEqual([...support].filter((queryId) => evaluation.has(queryId)), []);
});

test("support identifiers preserve lexicographic presentation order", () => {
  const ids = demoSupportTasks.map((task) => task.queryId);
  assert.deepEqual(ids, [...ids].sort());
  assert.ok(ids.every((id) => /_s_\d{3}$/.test(id)));
});

test("the interface contains all eight worked practice topics", () => {
  assert.equal(practiceTopics.length, 8);
});
