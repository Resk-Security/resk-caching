import { recordHttpDuration, recordHttpRequest } from "../metrics/metrics";
import { getLogger } from "../shared/logger";

import { rateLimit } from "./rate-limit";
import { cacheController } from "./routes/cache";
import { metricsHandler } from "./routes/metrics";
import { openapiDocument } from "./routes/openapi";
import { semanticController } from "./routes/semantic";
import { authMiddleware } from "./security";

// Import new route handlers
import * as costRoutes from "./routes/cost";
import * as performanceRoutes from "./routes/performance";
import * as testingRoutes from "./routes/testing";

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
      // Cost tracking endpoints
      else if (path === "/api/cost/record" && method === "POST") res = await withCorrelation(correlationId, () => costRoutes.recordCost(req));
      else if (path === "/api/cost/analysis" && method === "GET") res = await withCorrelation(correlationId, () => costRoutes.getCostAnalysis(req));
      else if (path === "/api/cost/breakdown" && method === "GET") res = await withCorrelation(correlationId, () => costRoutes.getCostBreakdown(req));
      else if (path === "/api/cost/recent" && method === "GET") res = await withCorrelation(correlationId, () => costRoutes.getRecentCosts(req));
      else if (path === "/api/cost/pricing" && method === "POST") res = await withCorrelation(correlationId, () => costRoutes.addPricing(req));
      else if (path === "/api/cost/pricing" && method === "GET") res = await withCorrelation(correlationId, () => costRoutes.getPricing(req));
      // Performance optimization endpoints
      else if (path === "/api/performance/record" && method === "POST") res = await withCorrelation(correlationId, () => performanceRoutes.recordMetric(req));
      else if (path === "/api/performance/benchmarks" && method === "GET") res = await withCorrelation(correlationId, () => performanceRoutes.getBenchmarks(req));
      else if (path === "/api/performance/slow-queries" && method === "GET") res = await withCorrelation(correlationId, () => performanceRoutes.getSlowQueries(req));
      else if (path === "/api/performance/recommendations" && method === "GET") res = await withCorrelation(correlationId, () => performanceRoutes.getOptimizationRecommendations(req));
      else if (path === "/api/performance/warming/start" && method === "POST") res = await withCorrelation(correlationId, () => performanceRoutes.startCacheWarming(req));
      else if (path === "/api/performance/warming/progress" && method === "GET") res = await withCorrelation(correlationId, () => performanceRoutes.getWarmingProgress(req));
      else if (path === "/api/performance/metrics" && method === "GET") res = await withCorrelation(correlationId, () => performanceRoutes.getRecentMetrics(req));
      // Testing and mock endpoints
      else if (path === "/api/testing/chat/completions" && method === "POST") res = await withCorrelation(correlationId, () => testingRoutes.createChatCompletion(req));
      else if (path === "/api/testing/mock/responses" && method === "POST") res = await withCorrelation(correlationId, () => testingRoutes.addMockResponse(req));
      else if (path === "/api/testing/mock/responses" && method === "GET") res = await withCorrelation(correlationId, () => testingRoutes.getMockResponses(req));
      else if (path === "/api/testing/scenarios" && method === "POST") res = await withCorrelation(correlationId, () => testingRoutes.addTestScenario(req));
      else if (path === "/api/testing/scenarios" && method === "GET") res = await withCorrelation(correlationId, () => testingRoutes.getTestScenarios(req));
      else if (path === "/api/testing/scenarios/run" && method === "POST") res = await withCorrelation(correlationId, () => testingRoutes.runTestScenario(req));
      else if (path === "/api/testing/scenarios/run-all" && method === "POST") res = await withCorrelation(correlationId, () => testingRoutes.runAllTestScenarios(req));
      else if (path === "/api/testing/history" && method === "GET") res = await withCorrelation(correlationId, () => testingRoutes.getRequestHistory(req));
      else if (path === "/api/testing/scenarios/defaults" && method === "POST") res = await withCorrelation(correlationId, () => testingRoutes.loadDefaultTestScenarios(req));
      else if (path === "/api/testing/health" && method === "GET") res = await withCorrelation(correlationId, () => testingRoutes.getHealthStatus(req));
      else if (path === "/api/testing/circuit-breakers" && method === "GET") res = await withCorrelation(correlationId, () => testingRoutes.getCircuitBreakerStats(req));
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


