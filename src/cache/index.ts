import { inMemoryCache } from "./in-memory";
import { createRedisCache } from "./redis-bun";
import { SecureCacheWrapper } from "./secure-wrapper";
import { sqliteCache } from "./sqlite";
import type { CacheBackend } from "./types";

export function selectCache(): CacheBackend {
  const backend = (Bun.env.CACHE_BACKEND ?? "memory").toLowerCase();
  const inner = backend === "redis" ? createRedisCache() : backend === "sqlite" ? sqliteCache : inMemoryCache;
  return new SecureCacheWrapper(inner);
}


