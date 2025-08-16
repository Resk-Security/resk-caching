import { recordHttpDuration, recordHttpRequest } from "../metrics/metrics";
import { getLogger } from "../shared/logger";

import { rateLimit } from "./rate-limit";
import { cacheController } from "./routes/cache";
import { semanticController } from "./routes/semantic";
import { metricsHandler } from "./routes/metrics";
import { openapiDocument } from "./routes/openapi";
import { authMiddleware } from "./security";

const logger = getLogger();

export const router = {
  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method.toUpperCase();
    const correlationId = req.headers.get("x-correlation-id") || crypto.randomUUID();

    // Health endpoint (no auth)
    if (path === "/health" && method === "GET") {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json", "x-correlation-id": correlationId },
      });
    }

    // Authenticated API under /api
    if (path.startsWith("/api/")) {
      if (path === "/api/metrics" && method === "GET") {
        return metricsHandler();
      }
      if (path === "/api/openapi.json" && method === "GET") {
        return new Response(JSON.stringify(openapiDocument), { headers: { "content-type": "application/json", "x-correlation-id": correlationId } });
      }
      const auth = await authMiddleware(req);
      if (!auth.ok) return auth.response;
      const rl = rateLimit(req);
      if (!rl.ok) return rl.response;

      const started = performance.now();
      let res: Response | null = null;
      if (path === "/api/cache" && method === "POST") res = await withCorrelation(correlationId, () => cacheController.put(req));
      else if (path === "/api/cache" && method === "DELETE") res = await withCorrelation(correlationId, () => cacheController.clear());
      else if (path === "/api/cache/query" && method === "POST") res = await withCorrelation(correlationId, () => cacheController.query(req));
      // Semantic search endpoints
      else if (path === "/api/semantic/store" && method === "POST") res = await withCorrelation(correlationId, () => semanticController.storeLLMResponse(req));
      else if (path === "/api/semantic/search" && method === "POST") res = await withCorrelation(correlationId, () => semanticController.searchSimilar(req));
      else if (path === "/api/semantic/responses" && method === "GET") res = await withCorrelation(correlationId, () => semanticController.getResponses(req));
      else if (path === "/api/semantic/stats" && method === "GET") res = await withCorrelation(correlationId, () => semanticController.getStats());
      else res = new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "content-type": "application/json", "x-correlation-id": correlationId } });

      const ended = performance.now();
      recordHttpRequest({ method, route: path, status: res.status });
      recordHttpDuration(ended - started, { method, route: path, status: res.status });
      return res;
    }

    logger.warn({ path, method }, "Unhandled route");
    return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: { "content-type": "application/json", "x-correlation-id": correlationId } });
  },
};

function withCorrelation(id: string, fn: () => Promise<Response>): Promise<Response> {
  return fn().then((res) => {
    const headers = new Headers(res.headers);
    headers.set("x-correlation-id", id);
    return new Response(res.body, { headers, status: res.status, statusText: res.statusText });
  });
}


