import type { CacheBackend } from "./types";

type CacheEntry = { value: unknown; expiresAt: number | null };

class InMemoryCache implements CacheBackend {
  private store = new Map<string, CacheEntry>();

  async get(key: string): Promise<unknown | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const expiresAt = typeof ttlSeconds === "number" ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

export const inMemoryCache = new InMemoryCache();


