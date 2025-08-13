import { redis as defaultRedis, RedisClient } from "bun";

import type { CacheBackend } from "./types";


const KEY_PREFIX = "rc:";

function withPrefix(key: string): string {
  return key.startsWith(KEY_PREFIX) ? key : KEY_PREFIX + key.replace(/^rc:/, "");
}

/**
 * Redis cache backend using Bun's native Redis client (RESP3, pipelining, TLS support)
 */
export class RedisBunCache implements CacheBackend {
  private client: RedisClient | typeof defaultRedis;
  private subscriber: RedisClient | null = null;

  constructor(url?: string) {
    this.client = url ? new RedisClient(url) : defaultRedis;
  }

  async get(key: string): Promise<unknown | null> {
    const k = withPrefix(key);
    const val = await this.client.get(k);
    if (val == null) return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const k = withPrefix(key);
    const payload = JSON.stringify(value);
    await this.client.set(k, payload);
    if (typeof ttlSeconds === "number" && ttlSeconds > 0) {
      await this.client.expire(k, ttlSeconds);
    }
  }

  async clear(): Promise<void> {
    // Scan & delete keys with our prefix to avoid FLUSHALL
    let cursor = "0";
    do {
      const res = (await this.client.send("SCAN", [cursor, "MATCH", `${KEY_PREFIX}*`, "COUNT", "1000"])) as [string, string[]];
      cursor = res[0];
      const keys = res[1] ?? [];
      if (keys.length > 0) {
        // DEL supports multiple keys
        await this.client.send("DEL", keys);
      }
    } while (cursor !== "0");
  }

  // Pub/Sub helpers (optional)
  async publish(channel: string, message: string): Promise<void> {
    await this.client.send("PUBLISH", [channel, message]);
  }

  async subscribe(channel: string): Promise<void> {
    if (!this.subscriber) {
      const url = Bun.env.REDIS_URL;
      this.subscriber = url ? new RedisClient(url) : new RedisClient();
    }
    const sub = this.subscriber;
    // Use raw commands for SUBSCRIBE
    await sub.send("SUBSCRIBE", [channel]);
    // Bun's Redis client currently exposes callbacks via onmessage on RESP3 pubsub responses is not yet formalized; poll as workaround
    // Simple polling for demonstration; production should use proper event hooks when available.
    (async () => {
      for (;;) {
        await new Promise((r) => setTimeout(r, 200));
        // no-op; placeholder to keep connection alive
      }
    })();
  }

  // Variant storage helpers
  async pushVariantToList(baseKey: string, payload: string): Promise<void> {
    const k = withPrefix(`${baseKey}:variants`);
    await this.client.send("RPUSH", [k, payload]);
  }

  async getRandomVariantFromSet(baseKey: string): Promise<string | null> {
    const k = withPrefix(`${baseKey}:vset`);
    const res = (await this.client.send("SRANDMEMBER", [k])) as string | null;
    return res ?? null;
  }

  async addVariantToSet(baseKey: string, payload: string): Promise<void> {
    const k = withPrefix(`${baseKey}:vset`);
    await this.client.send("SADD", [k, payload]);
  }

  async nextRoundRobinIndex(baseKey: string): Promise<number> {
    const k = withPrefix(`${baseKey}:rr`);
    const v = (await this.client.incr(k)) as number;
    return Number(v);
  }
}

export function createRedisCache(): RedisBunCache {
  const url = Bun.env.REDIS_URL; // default taken by Bun's `redis` if not provided
  return new RedisBunCache(url);
}


