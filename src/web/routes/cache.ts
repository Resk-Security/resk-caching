import { z } from "zod";

import { selectCache } from "../../cache";
import { buildCacheKey } from "../../cache/key";

const putSchema = z.object({
  query: z.string().min(1).max(10000),
  response: z.unknown(),
  ttl: z.number().int().positive().optional(),
  variantStrategy: z.enum(["random", "round-robin", "deterministic", "weighted"]).optional(),
  weights: z.array(z.number().positive()).optional(),
  seed: z.union([z.string(), z.number()]).optional(),
});

const querySchema = z.object({
  query: z.string().min(1).max(10000),
});

export const cacheController = {
  async put(req: Request): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: "Bad Request", details: parsed.error.flatten() }), { status: 400, headers: { "content-type": "application/json" } });

    const { query, response, ttl } = parsed.data;
    const key = buildCacheKey({ query });
    await selectCache().set(key, response, ttl);
    return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
  },

  async query(req: Request): Promise<Response> {
    const body = await req.json().catch(() => null);
    const parsed = querySchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: "Bad Request", details: parsed.error.flatten() }), { status: 400, headers: { "content-type": "application/json" } });

    const { query } = parsed.data;
    const key = buildCacheKey({ query });
    const value = await selectCache().get(key);
    // Variant-aware selection on server side
    if (
      value &&
      typeof value === "object" &&
      (value as Record<string, unknown>).variants &&
      Array.isArray((value as Record<string, unknown>).variants)
    ) {
      const v = value as { variants: unknown[]; variantStrategy?: string; weights?: number[]; seed?: string };
      const { selectVariant } = await import("../../variants/selector");
      const seed = v.seed ?? Bun.env.VARIANT_SEED ?? undefined;
      const rrProvider = async () => {
        // If Redis backend present, try round-robin counter for this key
        // Fallback to process-level counter
        try {
          const { createRedisCache } = await import("../../cache/redis-bun");
          const rr = await createRedisCache().nextRoundRobinIndex(key);
          return rr;
        } catch {
          const n = Number((globalThis as Record<string, unknown>).__rr || 0) + 1;
          (globalThis as Record<string, unknown>).__rr = n;
          return n;
        }
      };
      const result = await selectVariant({
        strategy: v.variantStrategy,
        variants: v.variants,
        weights: v.weights,
        seed,
        roundRobinIndexProvider: rrProvider,
      });
      if (result) {
        // metrics hook
        try {
          const { inc, counter } = await import("../../metrics/metrics");
          inc(counter("variant_selected_total", "Variants selected"), { key, idx: result.index, id: String((result.variant as { id?: string })?.id ?? result.index) });
        } catch {}
        return new Response(JSON.stringify(result.variant), { headers: { "content-type": "application/json" } });
      }
    }
    return new Response(JSON.stringify(value ?? { error: "No cached response" }), { headers: { "content-type": "application/json" } });
  },

  async clear(): Promise<Response> {
    await selectCache().clear();
    return new Response(JSON.stringify({ success: true }), { headers: { "content-type": "application/json" } });
  },
};


