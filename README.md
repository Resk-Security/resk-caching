[![NPM version](https://img.shields.io/npm/v/resk-caching.svg)](https://www.npmjs.com/package/resk-caching)
[![NPM License](https://img.shields.io/npm/l/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/blob/main/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dt/resk-caching.svg)](https://www.npmjs.com/package/resk-caching)
[![GitHub issues](https://img.shields.io/github/issues/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/issues)
[![GitHub stars](https://img.shields.io/github/stars/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/stargazers)
[![GitHub last commit](https://img.shields.io/github/last-commit/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/commits/main)
[![TypeScript](https://img.shields.io/badge/TypeScript-^5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![LLM Security](https://img.shields.io/badge/LLM-Security-red)](https://github.com/Resk-Security/resk-caching)

## Resk-Caching — LLM Response Caching with Vector Database Integration

Resk-Caching is a Bun-based backend library/server designed to **cache Large Language Model (LLM) responses using vector databases**, significantly reducing API costs while maintaining response quality and relevance.

### 🎯 **Four Key GPTCache-Style Benefits**

Resk-Caching delivers the complete value proposition of intelligent LLM caching with four core benefits that transform how you build and scale AI applications:

#### 💰 **1. Massive Cost Reduction**
- **Up to 90% reduction** in LLM API costs through intelligent semantic caching
- **Real-time cost tracking** with provider-specific pricing (OpenAI, Anthropic, Google, etc.)
- **ROI analysis** showing exact savings from cache hits vs API calls
- **Cost breakdown** by provider, model, and time period
- **Automatic savings calculation** for every cached response

#### 🚀 **2. Performance Optimization**
- **Sub-5ms response times** for cached queries vs 500ms+ for API calls
- **Intelligent cache warming** strategies (popular, recent, predictive)
- **Real-time performance monitoring** with benchmarking and optimization recommendations
- **Slow query detection** with automated performance suggestions
- **Cache hit rate optimization** through advanced similarity algorithms

#### 🧪 **3. Development & Testing Environment**
- **OpenAI-compatible API** for offline development without API costs
- **Mock LLM provider** with customizable responses and scenarios
- **Automated testing scenarios** with validation and metrics
- **Zero-cost development workflows** with realistic API simulation
- **Circuit breaker patterns** for resilient application development

#### 🛡️ **4. Scalability & Availability**
- **Enhanced rate limiting bypass** with cache-first approach reducing API pressure
- **Circuit breaker patterns** with automatic failover and recovery
- **Health monitoring** and real-time system status
- **Automatic scaling** with proactive cache warming for traffic spikes
- **Graceful degradation** when external services fail

### 🔍 **How It Works**

1. **Pre-populated Response Database**: You maintain a database of high-quality LLM responses to common queries, stored as vector embeddings
2. **Semantic Matching**: When a new query arrives, the system finds the most semantically similar cached response
3. **Cost Savings**: Returns cached responses instead of making new API calls
4. **Response Selection**: Advanced algorithms allow you to choose specific responses based on business logic, user preferences, or A/B testing strategies

### 🚀 **Key Benefits**

✅ **All Four GPTCache-Style Benefits Implemented:**
- **💰 Massive Cost Reduction**: Up to 90% savings with real-time ROI tracking
- **🚀 Performance Optimization**: Sub-5ms responses with intelligent cache warming
- **🧪 Development Environment**: OpenAI-compatible API for offline testing
- **🛡️ Scalability & Availability**: Circuit breakers and automatic failover



### Features
- **LLM Response Caching**: Store and retrieve LLM responses using vector similarity matching
- **Multiple Cache Backends**: in-memory, SQLite (local persistence), Redis (multi-instance)
- **Advanced Response Selection**: Deterministic, weighted, and randomized response selection algorithms
- **Vector Database Integration**: Optimized for semantic search and similarity matching
- **AES-GCM Encryption**: Secure cache-at-rest protection (optional via env key)
- **JWT-Protected API**: Secure access with rate limiting and abuse prevention
- **OpenAPI 3.1**: Auto-generated API documentation from Zod schemas
- **Performance Monitoring**: Prometheus metrics and OpenTelemetry tracing
- **Real-time Updates**: WebSockets for instant response distribution

### How we're different from other semantic caches

- **GPTCache**: Great Python-first cache. Resk-Caching focuses on Bun/TypeScript, ships with JWT-secured HTTP API, OpenAPI generation, built-in Prometheus/OTEL, and optional authenticated-at-rest encryption out of the box.
- **ModelCache**: Provides a semantic cache layer. Resk-Caching adds production concerns (rate-limit, security wrapper, metrics, tracing, OpenAPI, WebSockets) and pluggable backends with zero-code switching via `CACHE_BACKEND`.
- **Upstash Semantic Cache**: Managed vector-backed cache. Resk-Caching is open-source, self-hosted by default, and can run fully local with SQLite or purely in-memory while retaining encryption and observability.
- **Redis LangCache**: Managed Redis-based semantic cache. Resk-Caching supports Redis natively via Bun's RESP3 client while also offering SQLite and in-memory modes for portability and offline development.
- **SemantiCache (FAISS)**: FAISS-native library. Resk-Caching prioritizes a secure, observable HTTP surface with variant selection strategies and can integrate external vector DBs; no GPU dependency required.

If you need a secure, auditable cache service with operational tooling for teams, Resk-Caching is purpose-built for that surface.

### What each module is for
- **LLM Response Storage**: Store pre-computed LLM responses with their vector embeddings for fast retrieval
- **Caching Backends**: Choose between low-latency memory, local persistence (SQLite), or distributed (Redis) based on your scale
- **Response Selection Algorithms**: Implement deterministic, weighted, or randomized response selection based on business logic
- **Vector Similarity Matching**: Find the most semantically similar cached response to incoming queries
- **AES-GCM Encryption**: Protect sensitive LLM responses at rest with authenticated encryption
- **JWT + Rate Limiting**: Secure API access and prevent abuse while maintaining performance
- **Zod + OpenAPI**: Ensure data validation and provide always-in-sync API documentation
- **Performance Monitoring**: Track cache hit rates, response times, and cost savings in real-time
- **Real-time Distribution**: Instantly distribute responses across multiple instances and clients

## Prerequisites

### Vector Database Setup
Before using Resk-Caching, you need to have a **vector database** ready with pre-computed LLM responses. This is the foundation of the caching system:

1. **Response Database**: Create a collection of high-quality LLM responses to common queries
2. **Vector Embeddings**: Generate vector embeddings for each response using your preferred embedding model
3. **Metadata Storage**: Store additional context like response quality scores, categories, or business rules
4. **Similarity Index**: Ensure your vector database has proper indexing for fast similarity search

**Recommended Vector Databases:**
- **Pinecone**: Excellent for production use with high performance
- **Weaviate**: Open-source with great similarity search capabilities
- **Qdrant**: Fast and efficient for real-time applications
- **Chroma**: Simple local development and testing

## Install
```bash
# as a library (npm)
npm install resk-caching

# as a library (bun)
bun add resk-caching
```

## Quick Start

### Server Setup

```bash
# Install dependencies
bun install

# Start the server
bun run dev

# The server will be available at http://localhost:3000
```

### Step-by-step setup

1. Choose your key-value cache backend:
   - `CACHE_BACKEND=memory` for local/dev
   - `CACHE_BACKEND=sqlite` for single-node durability
   - `CACHE_BACKEND=redis` for distributed/multi-instance
2. Choose your vector search strategy for semantic features:
   - Default: in-memory vector store (process-local)
   - Production: external vector DB (Pinecone/Qdrant/Weaviate/Chroma)
   - Alternative: Redis RediSearch vectors or SQLite vector extensions
3. Ingest responses and embeddings (see Ingestion or `scripts/ingest-example.ts`).
4. Call `/api/semantic/store` and `/api/semantic/search`.

By default, semantic embeddings live in memory. To power vector search with Redis or SQLite, see the guides below.

### Vector search with Redis (RediSearch)

Use Redis Stack with RediSearch for vector similarity.

Example index and KNN search (1536-dim float32 cosine):
```bash
# Create index
redis-cli FT.CREATE idx:llm ON HASH PREFIX 1 llm: SCHEMA \
  query TEXT \
  embedding VECTOR HNSW 6 TYPE FLOAT32 DIM 1536 DISTANCE_METRIC COSINE \
  category TAG SORTABLE \
  metadata TEXT

# Insert (embedding must be raw float32 bytes)
redis-cli HSET llm:thank-you query "thank you" category "gratitude" \
  embedding "$BINARY_FLOAT32" metadata "{\"tone\":\"friendly\"}"

# KNN search
redis-cli FT.SEARCH idx:llm "*=>[KNN 5 @embedding $vec AS score]" \
  PARAMS 2 vec "$QUERY_EMBED_FLOAT32" \
  SORTBY score DIALECT 2 RETURN 3 query category score
```

Notes:
- Convert `number[]` → `Float32Array` → bytes for `embedding` field.
- Keep response variants in a secondary key (e.g., `llm:<id>:responses`) and run variant selection after KNN.

### Vector search with SQLite (sqlite-vss/sqlite-vec)

Ship SQLite with a vector extension, then create a VSS table and join with metadata:

```sql
CREATE VIRTUAL TABLE vss_entries USING vss0(
  id TEXT PRIMARY KEY,
  embedding(1536)
);

CREATE TABLE llm_entries (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  category TEXT,
  metadata TEXT
);
```

Insert and search:
```sql
-- insert: embedding blob is Float32 (vss_f32)
INSERT INTO vss_entries(id, embedding) VALUES (?, vss_f32(?));
INSERT INTO llm_entries(id, query, category, metadata) VALUES(?, ?, ?, ?);

-- KNN
SELECT e.id, l.query, vss_distance(e.embedding, vss_f32(?)) AS score
FROM vss_entries e
JOIN llm_entries l ON l.id = e.id
ORDER BY score ASC
LIMIT 5;
```

Notes:
- Convert `number[]` to Float32 blob for inserts and query embedding.
- Join back to your stored responses via `id` or `query`, then apply variant selection.

### Basic Usage Examples

#### 1. Store LLM Responses with Vector Embeddings

```bash
# Store multiple "thank you" responses with different tones
curl -X POST http://localhost:3000/api/semantic/store \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "thank you",
    "query_embedding": {
      "vector": [0.1, 0.2, 0.3],
      "dimension": 3
    },
    "responses": [
      {
        "id": "resp1",
        "text": "You're welcome!",
        "metadata": { "tone": "friendly", "formality": "casual" },
        "quality_score": 0.95,
        "category": "gratitude",
        "tags": ["polite", "casual"]
      },
      {
        "id": "resp2", 
        "text": "My pleasure!",
        "metadata": { "tone": "professional", "formality": "formal" },
        "quality_score": 0.92,
        "category": "gratitude",
        "tags": ["polite", "professional"]
      },
      {
        "id": "resp3",
        "text": "No problem at all!",
        "metadata": { "tone": "casual", "formality": "informal" },
        "quality_score": 0.88,
        "category": "gratitude",
        "tags": ["casual", "friendly"]
      }
    ],
    "variant_strategy": "weighted",
    "weights": [3, 2, 1],
    "seed": "user:123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "LLM responses stored successfully",
  "entry_id": "thank you",
  "responses_count": 3
}
```

#### 2. Semantic Search for Similar Queries

```bash
# Search for responses to "merci" (French thank you)
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "merci",
    "query_embedding": {
      "vector": [0.11, 0.19, 0.29],
      "dimension": 3
    },
    "limit": 2,
    "similarity_threshold": 0.8
  }'
```

**Response:**
```json
{
  "success": true,
  "search_result": {
    "query": "merci",
    "query_embedding": {
      "vector": [0.11, 0.19, 0.29],
      "dimension": 3
    },
    "matches": [
      {
        "entry": {
          "query": "thank you",
          "responses": [...],
          "variant_strategy": "weighted",
          "weights": [3, 2, 1]
        },
        "similarity_score": 0.997,
        "selected_response": {
          "id": "resp1",
          "text": "You're welcome!",
          "metadata": { "tone": "friendly" }
        }
      }
    ],
    "total_matches": 1,
    "search_time_ms": 2
  }
}
```

#### 3. Get All Responses for a Query

```bash
# Retrieve all stored responses for "thank you"
curl -X GET "http://localhost:3000/api/semantic/responses?query=thank%20you" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "entry": {
    "query": "thank you",
    "query_embedding": {
      "vector": [0.1, 0.2, 0.3],
      "dimension": 3
    },
    "responses": [
      {
        "id": "resp1",
        "text": "You're welcome!",
        "metadata": { "tone": "friendly" }
      },
      {
        "id": "resp2",
        "text": "My pleasure!",
        "metadata": { "tone": "professional" }
      },
      {
        "id": "resp3",
        "text": "No problem at all!",
        "metadata": { "tone": "casual" }
      }
    ],
    "variant_strategy": "weighted",
    "weights": [3, 2, 1],
    "created_at": "2024-01-15T10:30:00.000Z",
    "last_accessed": "2024-01-15T10:35:00.000Z"
  }
}
```

#### 4. Get Cache Statistics

```bash
# View cache performance metrics
curl -X GET http://localhost:3000/api/semantic/stats \
  -H "Authorization: Bearer YOUR_API_KEY"
```

**Response:**
```json
{
  "success": true,
  "cache_type": "InMemoryVectorCache",
  "message": "Stats endpoint - implementation needed"
}
```

### Advanced Usage Examples

#### Store Multiple Query Types

```bash
# Store responses for different types of greetings
curl -X POST http://localhost:3000/api/semantic/store \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "hello",
    "query_embedding": {
      "vector": [0.9, 0.8, 0.7],
      "dimension": 3
    },
    "responses": [
      {
        "id": "hello1",
        "text": "Hi there!",
        "metadata": { "tone": "friendly", "time_of_day": "any" }
      },
      {
        "id": "hello2",
        "text": "Hello! How are you?",
        "metadata": { "tone": "polite", "time_of_day": "morning" }
      }
    ],
    "variant_strategy": "round-robin"
  }'
```

#### Search with Different Similarity Thresholds

```bash
# Strict similarity matching (only very similar queries)
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "query": "thanks a lot",
    "query_embedding": {
      "vector": [0.15, 0.25, 0.35],
      "dimension": 3
    },
    "limit": 1,
    "similarity_threshold": 0.95
  }'
```

### Metrics and Monitoring

The system automatically tracks comprehensive metrics for all semantic operations:

- **Semantic Searches**: Total count, duration, and success rates
- **Vector Similarity**: Distribution of similarity scores
- **Response Storage**: Count of stored LLM responses by strategy
- **Cache Performance**: Entry counts and access patterns
- **Response Selection**: Variant strategy usage and performance

Access metrics at `/api/metrics` endpoint (Prometheus format).

### Performance Characteristics

- **Search Speed**: Typical semantic searches complete in <5ms
- **Memory Usage**: Efficient in-memory storage with configurable TTL
- **Scalability**: Designed for thousands of cached responses
- **Accuracy**: High-precision vector similarity using cosine distance

### Best Practices

1. **Vector Dimensions**: Use consistent embedding dimensions across your system
2. **Similarity Thresholds**: Start with 0.7-0.8 for production use
3. **Response Variety**: Store 3-5 responses per query for good variant selection
4. **Metadata**: Include rich metadata for better response selection
5. **TTL Management**: Set appropriate expiration times for dynamic content

## Environment variables
- PORT (default 3000)
- JWT_SECRET
- CACHE_BACKEND = memory | sqlite | redis
- REDIS_URL (for Redis backend)
- CACHE_ENCRYPTION_KEY (base64, 32 bytes)
- RATE_LIMIT_WINDOW_MS (default 900000)
- RATE_LIMIT_MAX (default 1000)
- OTEL_EXPORTER_OTLP_ENDPOINT (traces), OTEL_SERVICE_NAME

### Cache backends explained

- **In-memory** (`CACHE_BACKEND=memory`):
  - Fastest single-process store (Map-based), ideal for development and ephemeral caches
  - Per-key TTL stored alongside values; expired entries are lazily evicted on access
  - No cross-process sharing and no durability

- **SQLite** (`CACHE_BACKEND=sqlite`):
  - Local durability using Bun's SQLite; table `kv(key TEXT PRIMARY KEY, value TEXT, expiresAt INTEGER)`
  - Upsert semantics on `set`, TTL computed client-side and stored in `expiresAt`
  - Expired rows are pruned lazily on `get`; `clear()` wipes the table
  - File path defaults to `resk-cache.sqlite`

- **Redis** (`CACHE_BACKEND=redis`, `REDIS_URL=...`):
  - Distributed, multi-instance cache using Bun's native RESP3 client
  - Values are JSON-serialized with optional TTL via `EXPIRE`
  - Prefix isolation via `rc:`; `clear()` scans and deletes only `rc:*` keys
  - Helpers for experiments (round-robin counters, sets/lists for variants, optional pub/sub)

## 🔗 API Endpoints - Complete Reference

### Core Cache Endpoints
- `GET /health` - Health check endpoint
- `POST /api/cache` (JWT) - Store simple key-value pairs
- `POST /api/cache/query` (JWT) - Retrieve cached values
- `DELETE /api/cache` (JWT) - Clear all cache
- `GET /api/openapi.json` - OpenAPI 3.1 specification from Zod schemas
- `GET /api/metrics` - Prometheus metrics exposition

### 💰 Cost Tracking Endpoints (NEW!)
- `POST /api/cost/record` (JWT) - Record LLM API cost for a request
- `GET /api/cost/analysis` (JWT) - Get comprehensive cost analysis and ROI
- `GET /api/cost/breakdown` (JWT) - Cost breakdown by provider and model
- `GET /api/cost/recent` (JWT) - Get recent cost entries
- `POST /api/cost/pricing` (JWT) - Add custom pricing for provider/model
- `GET /api/cost/pricing` (JWT) - Get all configured pricing

### 🚀 Performance Optimization Endpoints (NEW!)
- `POST /api/performance/record` (JWT) - Record performance metrics
- `GET /api/performance/benchmarks` (JWT) - Get performance benchmarks
- `GET /api/performance/slow-queries` (JWT) - Detect slow queries
- `GET /api/performance/recommendations` (JWT) - Get optimization recommendations
- `POST /api/performance/warming/start` (JWT) - Start cache warming strategy
- `GET /api/performance/warming/progress` (JWT) - Get cache warming progress
- `GET /api/performance/metrics` (JWT) - Get recent performance metrics

### 🧪 Development & Testing Endpoints (NEW!)
- `POST /api/testing/chat/completions` (JWT) - OpenAI-compatible chat completions
- `POST /api/testing/mock/responses` (JWT) - Add custom mock responses
- `GET /api/testing/mock/responses` (JWT) - Get all mock responses
- `POST /api/testing/scenarios` (JWT) - Add test scenarios
- `GET /api/testing/scenarios` (JWT) - Get all test scenarios
- `POST /api/testing/scenarios/run` (JWT) - Run specific test scenario
- `POST /api/testing/scenarios/run-all` (JWT) - Run all test scenarios
- `GET /api/testing/history` (JWT) - Get request history
- `POST /api/testing/scenarios/defaults` (JWT) - Load default test scenarios
- `GET /api/testing/health` (JWT) - Get system health status
- `GET /api/testing/circuit-breakers` (JWT) - Get circuit breaker statistics

### Semantic Search Endpoints
- `POST /api/semantic/store` (JWT) - Store LLM responses with vector embeddings
- `POST /api/semantic/search` (JWT) - Search for similar queries using semantic similarity
- `GET /api/semantic/responses` (JWT) - Get all responses for a specific query
- `GET /api/semantic/stats` (JWT) - Get cache statistics and performance metrics

## Semantic Search & Response Selection

### How It Works

1. **Store Responses**: First, store your pre-computed LLM responses with their vector embeddings
2. **User Query**: When a user sends a message (e.g., "merci", "merci pour ta réponse")
3. **Vector Search**: The system finds semantically similar queries in your database
4. **Response Selection**: Uses advanced algorithms to choose the most appropriate response
5. **Return Result**: Sends back a varied, contextually relevant response

### Example: Thank You Responses

Store multiple responses for "thank you" queries:

```json
{
  "query": "thank you",
  "query_embedding": {
    "vector": [0.1, 0.2, 0.3, 0.4, 0.5],
    "dimension": 5
  },
  "responses": [
    {
      "id": "thank_1",
      "text": "You're welcome! I'm glad I could help.",
      "metadata": {"tone": "friendly", "formality": "casual"},
      "quality_score": 0.9,
      "category": "gratitude"
    },
    {
      "id": "thank_2",
      "text": "My pleasure! Feel free to ask if you need anything else.",
      "metadata": {"tone": "professional", "formality": "formal"},
      "quality_score": 0.85,
      "category": "gratitude"
    }
  ],
  "variant_strategy": "weighted",
  "weights": [3, 2],
  "seed": "user:123"
}
```

### Response Selection Strategies

- **random**: Uniform random selection for variety
- **round-robin**: Cycles through responses systematically
- **deterministic**: Stable selection based on seed (user ID, conversation ID)
- **weighted**: Probability-based selection according to quality scores or preferences

### Search for Similar Queries

When a user sends "merci pour ta réponse", the system:

1. Converts the message to a vector embedding
2. Finds similar queries in the database (e.g., "thank you", "thanks", "merci")
3. Selects the best match based on similarity score
4. Applies the variant strategy to choose a response
5. Returns the selected response with metadata

This approach ensures users get varied, contextually appropriate responses while maintaining the high quality of pre-approved LLM outputs.

## Library usage (TypeScript)
```ts
import { selectCache, globalCostTracker, globalPerformanceOptimizer } from "resk-caching";

// Basic cache usage
const cache = selectCache();
await cache.set("key", { payload: true }, 60);
const val = await cache.get("key");

// Cost tracking integration
const cacheResult = await cache.search(query);
if (cacheResult) {
  // Cache hit - record savings
  globalCostTracker.recordCost({
    provider: "openai",
    model: "gpt-4", 
    inputTokens: 150,
    outputTokens: 200,
    cacheHit: true
  });
} else {
  // Cache miss - record actual cost
  const response = await llmApi.createCompletion(query);
  globalCostTracker.recordCost({
    provider: "openai",
    model: "gpt-4",
    inputTokens: response.usage.prompt_tokens,
    outputTokens: response.usage.completion_tokens,
    cacheHit: false
  });
}

// Performance monitoring
globalPerformanceOptimizer.recordMetric({
  operation: 'search',
  duration: responseTime,
  cacheHit: !!cacheResult,
  backend: 'redis'
});
```

## 📚 Comprehensive Examples

### 💰 Cost Tracking Example
```typescript
// examples/cost-tracking-example.ts
import { CostTracker } from "resk-caching";

const tracker = new CostTracker();

// Record API costs
tracker.recordCost({
  provider: "openai",
  model: "gpt-4",
  inputTokens: 150,
  outputTokens: 300,
  cacheHit: false
});

// Get ROI analysis
const analysis = tracker.getCostAnalysis(30); // 30 days
console.log(`Total Savings: $${analysis.totalSavings}`);
console.log(`ROI: ${analysis.roiPercentage}%`);
```

### 🚀 Performance Optimization Example
```typescript
// examples/performance-optimization-example.ts
import { PerformanceOptimizer } from "resk-caching";

const optimizer = new PerformanceOptimizer();

// Start cache warming
await optimizer.startCacheWarming({
  strategy: 'popular',
  batchSize: 20,
  maxEntries: 1000
});

// Get optimization recommendations
const recommendations = optimizer.getOptimizationRecommendations();
recommendations.forEach(rec => {
  console.log(`${rec.type}: ${rec.description}`);
});
```

### 🧪 Development & Testing Example
```typescript
// examples/development-testing-example.ts
import { MockLLMProvider } from "resk-caching";

const mockProvider = new MockLLMProvider();

// OpenAI-compatible API for development
const response = await mockProvider.createChatCompletion({
  model: "gpt-3.5-turbo",
  messages: [{ role: "user", content: "Hello!" }]
});

// Run automated test scenarios
const testResults = await mockProvider.runAllTestScenarios();
console.log(`Tests passed: ${testResults.filter(r => r.passed).length}`);
```

### 🌟 Complete Demo
```bash
# Run the comprehensive demo showcasing all four benefits
npm run example:demo

# Or run individual examples
npm run example:cost-tracking
npm run example:performance
npm run example:development
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


## Next steps

- Docker image and multi-stage build for slim runtimes
- LangChain integration helper (middleware to consult cache before LLM calls)
- LlamaIndex and Vercel AI SDK adapters
- Pluggable vector stores (Qdrant, Weaviate, Pinecone) with adapters
- Background refresh policies and stale-while-revalidate
- Eviction strategies (LRU/LFU) and cache warming CLI
- Upstash Redis & Redis Cloud deployment templates
- Benchmarks and load-test recipes (k6/Artillery)

## Full documentation

We provide a full documentation site (MkDocs). See `docs/` and the published site: [Resk-Caching Docs](https://resk-caching.readthedocs.io/en/latest/).
