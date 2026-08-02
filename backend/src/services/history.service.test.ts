import { test } from "node:test";
import assert from "node:assert/strict";
import { buildHistoryWhere } from "./history.service";

test("buildHistoryWhere scopes to the given user with no filters", () => {
  const where = buildHistoryWhere("user-1", {});
  assert.deepEqual(where, { userId: "user-1" });
});

test("buildHistoryWhere applies mode and provider filters", () => {
  const where = buildHistoryWhere("user-1", { mode: "quick", provider: "gemini" });
  assert.equal(where.mode, "quick");
  assert.equal(where.provider, "gemini");
});

test("buildHistoryWhere applies an inclusive date range", () => {
  const dateFrom = new Date("2026-01-01T00:00:00.000Z");
  const dateTo = new Date("2026-01-31T23:59:59.999Z");
  const where = buildHistoryWhere("user-1", { dateFrom, dateTo });
  assert.deepEqual(where.createdAt, { gte: dateFrom, lte: dateTo });
});

test("buildHistoryWhere searches both input and output text case-insensitively", () => {
  const where = buildHistoryWhere("user-1", { search: "roadmap" });
  assert.deepEqual(where.OR, [
    { inputText: { contains: "roadmap", mode: "insensitive" } },
    { outputText: { contains: "roadmap", mode: "insensitive" } },
  ]);
});

test("buildHistoryWhere omits search/date/mode/provider clauses when not provided", () => {
  const where = buildHistoryWhere("user-1", { search: undefined, mode: undefined });
  assert.equal(where.OR, undefined);
  assert.equal(where.mode, undefined);
  assert.equal(where.createdAt, undefined);
});
