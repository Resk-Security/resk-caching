## Cache backends

Set `CACHE_BACKEND=memory | sqlite | redis`.

### In-memory (`memory`)
- Fastest single-process Map-based storage.
- TTL kept per-entry; expired entries removed lazily during `get`.
- No cross-process sharing, no durability.

Code reference:
```ts
// src/cache/in-memory.ts
class InMemoryCache { /* Map<string, { value, expiresAt }> */ }
```

### SQLite (`sqlite`)
- Durable local store using Bun's SQLite.
- Table: `kv(key TEXT PRIMARY KEY, value TEXT, expiresAt INTEGER)`.
- `set`: UPSERTs JSON-serialized value; `expiresAt` computed from TTL.
- `get`: lazily deletes expired rows, returns parsed JSON.
- Default path: `resk-cache.sqlite`.

Code reference:
```ts
// src/cache/sqlite.ts
export class SqliteCache { /* run/query over kv table */ }
```

### Redis (`redis`)
- Distributed cache via Bun's RESP3 client.
- JSON-serialized values; optional TTL via `EXPIRE`.
- Key prefix: `rc:`. `clear()` scans and deletes only `rc:*` keys.
- Helpers: round-robin counters, sets/lists for variants, basic pub/sub.

Code reference:
```ts
// src/cache/redis-bun.ts
export class RedisBunCache { /* get/set/clear + helpers */ }
```

### Embeddings management (important)
- Embeddings for semantic search are NOT stored in SQLite/Redis by default.
- Semantic features use an in-memory vector store:

```ts
// src/cache/vector-memory.ts
export class InMemoryVectorCache implements VectorSearchBackend {
  private entries = new Map<string, CachedLLMEntry>();
  private embeddings = new Map<string, number[]>();
  // storeLLMResponse(): keeps entry + query_embedding.vector in memory
  // searchSimilar(): cosine similarity across stored embeddings
}
```

- If you need persistence or large-scale vector search, use an external vector database (e.g., Pinecone, Weaviate, Qdrant). See `docs/ingestion.md` for ingestion and schema guidance.
- The core key-value cache backends (memory/sqlite/redis) are used for generic caching via `/api/cache` and `selectCache()`. The semantic routes (`/api/semantic/*`) currently use the in-memory vector cache only.

### Security wrapper
- All key-value backends selected via `selectCache()` are wrapped by `SecureCacheWrapper` which encrypts values at rest when `CACHE_ENCRYPTION_KEY` is set.
- The in-memory vector cache stores objects in clear by design; do not place secrets in semantic entries.

Code reference:
```ts
// src/cache/index.ts
export function selectCache(): CacheBackend { /* wraps chosen backend with SecureCacheWrapper */ }

// src/cache/secure-wrapper.ts
export class SecureCacheWrapper { /* encryptForCache/decryptFromCache */ }
```

### Environment
```bash
export CACHE_BACKEND=redis   # memory | sqlite | redis
export REDIS_URL=redis://localhost:6379
export CACHE_ENCRYPTION_KEY=base64_32_bytes_key
```

See also: `docs/ingestion.md` for vector DB setup and ingestion pipeline.
