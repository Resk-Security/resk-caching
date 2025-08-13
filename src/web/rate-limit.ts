import { loadConfig } from "../shared/config";

const cfg = loadConfig();
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: Request): { ok: true } | { ok: false; response: Response } {
  const now = Date.now();
  const windowMs = cfg.rateLimit.windowMs;
  const max = cfg.rateLimit.max;
  const key = buildKey(req);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= max) {
    const retry = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Too Many Requests" }), {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": String(retry) },
      }),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

function buildKey(req: Request): string {
  const ip = req.headers.get("x-forwarded-for") ?? "ip:" + (new URL(req.url)).hostname;
  const token = req.headers.get("authorization")?.slice(0, 20) ?? "anon";
  return `${ip}:${token}`;
}


