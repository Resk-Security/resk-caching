import { expect, test } from "bun:test";

import { encryptForCache, decryptFromCache } from "../src/security/encryption";

test("encryption roundtrip when key provided or fallback clear JSON when no key", async () => {
  const sample = { x: 1, y: "z" };
  const enc = await encryptForCache(sample);
  expect(typeof enc).toBe("string");
  const dec = await decryptFromCache(enc!);
  expect(dec).toEqual(sample);
});


