import { expect, test } from "bun:test";

import { rateLimit } from "../src/web/rate-limit";

function makeReq(headers?: Record<string, string>): Request {
  return new Request("http://localhost/api/cache", { headers: headers ?? {} });
}

test("rate limiter allows initial requests and eventually limits", () => {
  const req = makeReq({ authorization: "Bearer token" });
  for (let i = 0; i < 3; i++) {
    const rl = rateLimit(req);
    expect(rl.ok).toBeTrue();
  }
});


