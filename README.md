## Resk-Caching — LLM Response Caching with Vector Database Integration

Resk-Caching is a Bun-based backend library/server designed to **cache Large Language Model (LLM) responses using vector databases**, significantly reducing API costs while maintaining response quality and relevance.

### 🎯 **Primary Purpose: Cost Optimization for LLM APIs**

This library addresses the high costs associated with LLM API calls by implementing intelligent caching strategies. Instead of making expensive API calls to services like OpenAI, Claude, or other LLMs, Resk-Caching stores pre-computed responses in a vector database and retrieves them based on semantic similarity to incoming queries.

### 🔍 **How It Works**

1. **Pre-populated Response Database**: You maintain a database of high-quality LLM responses to common queries, stored as vector embeddings
2. **Semantic Matching**: When a new query arrives, the system finds the most semantically similar cached response
3. **Cost Savings**: Returns cached responses instead of making new API calls
4. **Response Selection**: Advanced algorithms allow you to choose specific responses based on business logic, user preferences, or A/B testing strategies

### 🚀 **Key Benefits**

- **Massive Cost Reduction**: Save LLM API costs
- **Consistent Quality**: Ensure high-quality, pre-approved responses
- **Customizable Selection**: Choose responses based on deterministic algorithms, weights, or business rules
- **Scalable Architecture**: Built for high-throughput production environments

[![NPM version](https://img.shields.io/npm/v/resk-caching.svg)](https://www.npmjs.com/package/resk-caching)
[![NPM License](https://img.shields.io/npm/l/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/blob/main/LICENSE)
[![NPM Downloads](https://img.shields.io/npm/dt/resk-caching.svg)](https://www.npmjs.com/package/resk-caching)
[![GitHub issues](https://img.shields.io/github/issues/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/issues)
[![GitHub stars](https://img.shields.io/github/stars/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/stargazers)
[![GitHub last commit](https://img.shields.io/github/last-commit/Resk-Security/resk-caching.svg)](https://github.com/Resk-Security/resk-caching/commits/main)
[![TypeScript](https://img.shields.io/badge/TypeScript-^5.4.5-blue.svg)](https://www.typescriptlang.org/)
[![LLM Security](https://img.shields.io/badge/LLM-Security-red)](https://github.com/Resk-Security/resk-caching)

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

## Quick start (server)
```bash
# env
export JWT_SECRET=dev-secret
export CACHE_BACKEND=memory            # or sqlite / redis
export PORT=3000

# run
npm run build && bun run dev

# Store LLM responses with vector embeddings
curl -H "Authorization: Bearer test" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "thank you",
       "query_embedding": {
         "vector": [0.1, 0.2, 0.3, 0.4, 0.5],
         "dimension": 5
       },
       "responses": [
         {
           "id": "thank_1",
           "text": "You'\''re welcome! I'\''m glad I could help.",
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
       "seed": "user:123",
       "ttl": 86400
     }' \
     http://localhost:3000/api/semantic/store

# Search for semantically similar queries
curl -H "Authorization: Bearer test" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "merci pour ta réponse",
       "query_embedding": {
         "vector": [0.12, 0.18, 0.28, 0.42, 0.48],
         "dimension": 5
       },
       "limit": 3,
       "similarity_threshold": 0.6
     }' \
     http://localhost:3000/api/semantic/search
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

### Core Cache Endpoints
- GET /health
- POST /api/cache (JWT) - Store simple key-value pairs
- POST /api/cache/query (JWT) - Retrieve cached values
- DELETE /api/cache (JWT) - Clear all cache
- GET /api/openapi.json (OpenAPI 3.1 from Zod)
- GET /api/metrics (Prometheus exposition)

### Semantic Search Endpoints (NEW!)
- POST /api/semantic/store (JWT) - Store LLM responses with vector embeddings
- POST /api/semantic/search (JWT) - Search for similar queries using semantic similarity
- GET /api/semantic/responses (JWT) - Get all responses for a specific query
- GET /api/semantic/stats (JWT) - Get cache statistics and performance metrics

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


