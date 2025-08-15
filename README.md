## Resk-Caching — Secure caching and vector-friendly backend

Resk-Caching is a Bun-based backend library/server for secure caching, embeddings orchestration, and vector DB access. It emphasizes security, performance, and observability.

[![NPM version](https://img.shields.io/npm/v/resk-caching.svg)](https://www.npmjs.com/package/resk-caching)
[![NPM License](https://img.shields.io/npm/l/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/blob/main/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dt/resk-caching.svg)](https://www.npmjs.com/package/resk-caching)
[![GitHub issues](https://img.shields.io/github/issues/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/issues)
[![GitHub stars](https://img.shields.io/github/stars/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/stargazers)
[![GitHub last commit](https://img.shields.io/github/last-commit/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/commits/main)
[![TypeScript](https://img.shields.io/badge/TypeScript-^5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![LLM Security](https://img.shields.io/badge/LLM-Security-red)](https://github.com/Resk-Security/resk-caching)

### Features
- Cache backends: in-memory, SQLite (local persistence), Redis (multi-instance)
- AES-GCM encryption for cache-at-rest (optional via env key)
- JWT-protected API with rate limiting
- OpenAPI 3.1 generated from Zod (single source of truth)
- Prometheus metrics and OpenTelemetry tracing
- WebSockets for real-time event fan-out; optional Redis pub/sub complement

### What each module is for
- Caching backends: pick low-latency memory, local persistence (SQLite), or distributed (Redis)
- AES-GCM encryption: protects cached payloads at rest with authenticated encryption
- JWT + rate-limiting: API protection and abuse prevention
- Zod + OpenAPI: runtime validation and always-in-sync API contracts and examples
- Prometheus + OpenTelemetry: real-time insight into performance, reliability, and request flows
- WebSockets + Redis pub/sub: instant fan-out to clients and multi-instance event distribution

## Install
```bash
# as a library (npm)
npm install resk-caching

# as a library (bun)
bun add resk-caching
```

## Quick start (server)
```bash
# env
export JWT_SECRET=dev-secret
export CACHE_BACKEND=memory            # or sqlite / redis
export PORT=3000

# run
npm run build && bun run dev

# API
curl -H "Authorization: Bearer test" \
     -H "Content-Type: application/json" \
     -d '{"query":"Hello","response":{"answer":"Hi"},"ttl":3600}' \
     http://localhost:3000/api/cache

curl -H "Authorization: Bearer test" \
     -H "Content-Type: application/json" \
     -d '{"query":"Hello"}' \
     http://localhost:3000/api/cache/query
```

## Environment variables
- PORT (default 3000)
- JWT_SECRET
- CACHE_BACKEND = memory | sqlite | redis
- REDIS_URL (for Redis backend)
- CACHE_ENCRYPTION_KEY (base64, 32 bytes)
- RATE_LIMIT_WINDOW_MS (default 900000)
- RATE_LIMIT_MAX (default 1000)
- OTEL_EXPORTER_OTLP_ENDPOINT (traces), OTEL_SERVICE_NAME

## Endpoints
- GET /health
- POST /api/cache (JWT)
- POST /api/cache/query (JWT)
- DELETE /api/cache (JWT)
- GET /api/openapi.json (OpenAPI 3.1 from Zod)
- GET /api/metrics (Prometheus exposition)

## Variants (A/B, randomized responses)
You can cache an object with variants and an optional selection strategy, for example:
```json
{
  "variants": [
    { "text": "You're welcome" },
    { "text": "My pleasure" },
    { "text": "No problem" }
  ],
  "variantStrategy": "deterministic",
  "weights": [3, 1, 1],
  "seed": "userId:conversationId"
}
```
Server-side selection strategies:
- random: uniform random
- round-robin: cycles; uses Redis INCR if available
- deterministic: stable by seed (user/conversation)
- weighted: weighted random according to weights

## Library usage (TypeScript)
```ts
import { selectCache } from "resk-caching";

const cache = selectCache();
await cache.set("key", { payload: true }, 60);
const val = await cache.get("key");
```

## OpenAPI and clients
- Fetch the spec: GET /api/openapi.json
- Use your preferred OpenAPI generator to produce clients/SDKs

## Observability
- Prometheus metrics at /api/metrics
- OpenTelemetry tracing via OTLP HTTP exporter (configure OTEL_EXPORTER_OTLP_ENDPOINT and OTEL_SERVICE_NAME)
- Correlation-ID header propagated for easier debugging

## Security model (summary)
- Secrets only on the server (env/secret manager). No secrets in frontend
- TLS transport; JWT short-lived; per-user/IP rate-limit
- Optional AES-GCM encryption at rest for persisted cache entries
- Structured logs with correlation-id; metrics and traces for forensics

## License
Apache-2.0 — see LICENSE

## Vector Database Integration

### Overview
Resk-Caching supports multiple vector database backends for similarity search and semantic caching. The system can ingest documents, compute embeddings, and store them in vector databases for efficient retrieval.

### Supported Vector Databases
- **Chroma**: Local or hosted ChromaDB instances
- **Pinecone**: Managed vector database service
- **Weaviate**: Open-source vector database
- **Milvus**: High-performance vector database
- **Custom adapters**: Extend for your specific needs

### Environment Configuration
```bash
# Vector Database Type
export VECTORDB_TYPE=pinecone  # or chroma, weaviate, milvus

# Embedding Provider
export EMBEDDING_PROVIDER=openai  # or huggingface, sentence-transformers
export EMBEDDING_MODEL=text-embedding-ada-002  # OpenAI model name
export OPENAI_API_KEY=your_openai_key_here

# Pinecone Configuration
export PINECONE_API_KEY=your_pinecone_key
export PINECONE_INDEX_HOST=https://your-index.pinecone.io
export PINECONE_INDEX_NAME=your-index-name

# Chroma Configuration
export CHROMA_HOST=localhost
export CHROMA_PORT=8000
export CHROMA_COLLECTION_NAME=documents

# Weaviate Configuration
export WEAVIATE_URL=http://localhost:8080
export WEAVIATE_API_KEY=your_weaviate_key
export WEAVIATE_CLASS_NAME=Document

# Milvus Configuration
export MILVUS_HOST=localhost
export MILVUS_PORT=19530
export MILVUS_COLLECTION_NAME=documents

# Batch Processing
export BATCH_SIZE=100  # Documents per batch for embeddings
export UPSERT_BATCH=50  # Documents per batch for vector DB
```

### Ingestion Script
Use the provided ingestion script to batch process documents:

```bash
# Run ingestion
bun run scripts/ingest-example.ts
```

The script will:
1. Read documents from your source
2. Compute embeddings in batches
3. Store vectors in the configured database
4. Handle retries and error recovery

### Example Ingestion Code
```typescript
import { createVectorDBAdapter } from 'resk-caching';
import { createEmbeddingProvider } from 'resk-caching';

async function ingestDocuments(documents: Document[]) {
  const vectorDB = createVectorDBAdapter();
  const embeddings = createEmbeddingProvider();
  
  // Process in batches
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    
    // Compute embeddings
    const vectors = await embeddings.embedBatch(
      batch.map(doc => doc.content)
    );
    
    // Prepare for storage
    const vectorsWithMetadata = batch.map((doc, idx) => ({
      id: doc.id,
      vector: vectors[idx],
      metadata: {
        title: doc.title,
        source: doc.source,
        timestamp: doc.timestamp
      }
    }));
    
    // Store in vector database
    await vectorDB.upsertBatch(vectorsWithMetadata);
  }
}
```

### Vector Search
```typescript
import { createVectorDBAdapter } from 'resk-caching';

async function searchSimilar(query: string, k: number = 5) {
  const vectorDB = createVectorDBAdapter();
  const embeddings = createEmbeddingProvider();
  
  // Get query embedding
  const queryVector = await embeddings.embed(query);
  
  // Search for similar vectors
  const results = await vectorDB.search(queryVector, {
    k,
    threshold: 0.7,  // Similarity threshold
    filters: {
      source: 'knowledge_base',
      timestamp: { $gte: '2024-01-01' }
    }
  });
  
  return results;
}
```

### Performance Considerations
- **Batch sizes**: Larger batches (100-500) for embeddings, smaller (50-100) for vector DB operations
- **Parallel processing**: Use worker threads for CPU-intensive embedding computation
- **Caching**: Cache frequently accessed embeddings and search results
- **Indexing**: Ensure proper vector database indexes are created for your use case

### Monitoring and Metrics
The system provides metrics for:
- Embedding computation latency and throughput
- Vector database operation success rates
- Search query performance
- Cache hit rates for vector operations

Access metrics at `/api/metrics` endpoint.


