import { decryptFromCache, encryptForCache } from "../security/encryption";

import type { CacheBackend } from "./types";

export class SecureCacheWrapper implements CacheBackend {
  constructor(private readonly inner: CacheBackend) {}

  async get(key: string): Promise<unknown | null> {
    const raw = await this.inner.get(key);
    if (raw == null) return null;
    if (typeof raw !== "string") return raw; // in-memory may store clear objects when encryption disabled
    const dec = await decryptFromCache(raw);
    return dec;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const enc = await encryptForCache(value);
    await this.inner.set(key, enc, ttlSeconds);
  }

  async clear(): Promise<void> {
    await this.inner.clear();
  }
}


