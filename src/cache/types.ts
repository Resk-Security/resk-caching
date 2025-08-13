export interface CacheBackend {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  clear(): Promise<void>;
}


