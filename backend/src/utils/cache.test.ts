import { test } from "node:test";
import assert from "node:assert/strict";
import { getOrSetCache, invalidateCache, clearCache } from "./cache";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("getOrSetCache calls the loader once and reuses the value within the TTL", async () => {
  clearCache();
  let calls = 0;
  const load = async () => {
    calls += 1;
    return "value";
  };

  const first = await getOrSetCache("key-a", 1000, load);
  const second = await getOrSetCache("key-a", 1000, load);

  assert.equal(first, "value");
  assert.equal(second, "value");
  assert.equal(calls, 1);
});

test("getOrSetCache reloads once the TTL has expired", async () => {
  clearCache();
  let calls = 0;
  const load = async () => {
    calls += 1;
    return `value-${calls}`;
  };

  const first = await getOrSetCache("key-b", 10, load);
  await sleep(20);
  const second = await getOrSetCache("key-b", 10, load);

  assert.equal(first, "value-1");
  assert.equal(second, "value-2");
  assert.equal(calls, 2);
});

test("invalidateCache forces the next call to reload", async () => {
  clearCache();
  let calls = 0;
  const load = async () => {
    calls += 1;
    return calls;
  };

  await getOrSetCache("key-c", 10_000, load);
  invalidateCache("key-c");
  await getOrSetCache("key-c", 10_000, load);

  assert.equal(calls, 2);
});

test("getOrSetCache keeps different keys independent", async () => {
  clearCache();
  const a = await getOrSetCache("key-d", 10_000, async () => "a");
  const b = await getOrSetCache("key-e", 10_000, async () => "b");
  assert.equal(a, "a");
  assert.equal(b, "b");
});
