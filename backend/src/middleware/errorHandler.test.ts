import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { errorHandler } from "./errorHandler";
import { AppError } from "../utils/errors";

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

function mockReq(id: string) {
  const errors: unknown[] = [];
  return {
    id,
    log: { error: (obj: unknown) => errors.push(obj) },
    loggedErrors: errors,
  } as unknown as Request & { id: string; loggedErrors: unknown[] };
}

test("errorHandler includes the request id so a client-reported error can be traced to a log line", () => {
  const req = mockReq("req-123");
  const res = mockRes();

  errorHandler(new AppError(404, "Summary not found."), req, res as unknown as Response, () => {});

  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Summary not found.", requestId: "req-123" });
});

test("errorHandler logs unhandled errors via req.log and still returns the request id", () => {
  const req = mockReq("req-456");
  const res = mockRes();

  errorHandler(new Error("boom"), req, res as unknown as Response, () => {});

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "Unexpected server error. Check server logs.", requestId: "req-456" });
  assert.equal(req.loggedErrors.length, 1);
});
