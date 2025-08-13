import { jwtVerify } from "jose";

import { loadConfig } from "../shared/config";

const cfg = loadConfig();

export async function authMiddleware(req: Request): Promise<{ ok: true } | { ok: false; response: Response }> {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return { ok: false, response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }) };
  }

  const token = auth.slice(7);
  try {
    if (!cfg.security.jwt.secret) throw new Error("JWT secret not configured");
    const encoder = new TextEncoder();
    await jwtVerify(token, encoder.encode(cfg.security.jwt.secret), {
      audience: cfg.security.jwt.audience ?? undefined,
      issuer: cfg.security.jwt.issuer ?? undefined,
    });
    return { ok: true };
  } catch {
    return { ok: false, response: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } }) };
  }
}


