import { test } from "node:test";
import assert from "node:assert/strict";
import { assertValidExpiryDays, generateToken, isExpired } from "./share.service";

test("generateToken produces a URL-safe token with no padding or slashes", () => {
  const token = generateToken();
  assert.match(token, /^[A-Za-z0-9_-]+$/);
  assert.ok(token.length >= 24);
});

test("generateToken produces unique values across calls", () => {
  const a = generateToken();
  const b = generateToken();
  assert.notEqual(a, b);
});

test("isExpired is false for a null expiry (never expires)", () => {
  assert.equal(isExpired(null), false);
});

test("isExpired is false for a future date", () => {
  assert.equal(isExpired(new Date(Date.now() + 60_000)), false);
});

test("isExpired is true for a past date", () => {
  assert.equal(isExpired(new Date(Date.now() - 60_000)), true);
});

test("assertValidExpiryDays accepts undefined (no expiry) and in-range values", () => {
  assert.doesNotThrow(() => assertValidExpiryDays(undefined));
  assert.doesNotThrow(() => assertValidExpiryDays(1));
  assert.doesNotThrow(() => assertValidExpiryDays(365));
});

test("assertValidExpiryDays rejects out-of-range values", () => {
  assert.throws(() => assertValidExpiryDays(0));
  assert.throws(() => assertValidExpiryDays(366));
  assert.throws(() => assertValidExpiryDays(-5));
});
