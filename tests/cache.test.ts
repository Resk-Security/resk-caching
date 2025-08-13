import { expect, test } from "bun:test";

import { inMemoryCache } from "../src/cache/in-memory";
import { buildCacheKey } from "../src/cache/key";

test("in-memory cache set/get with TTL", async () => {
  const key = buildCacheKey({ query: "Hello  World" });
  await inMemoryCache.set(key, { answer: 42 }, 1);
  const val = await inMemoryCache.get(key);
  expect(val).toEqual({ answer: 42 });
});

test("in-memory cache expires", async () => {
  const key = buildCacheKey({ query: "expire me" });
  await inMemoryCache.set(key, { gone: true }, 0);
  const val = await inMemoryCache.get(key);
  expect(val).toBeNull();
});


