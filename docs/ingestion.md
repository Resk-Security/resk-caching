## Ingestion and vector database

Semantic features require embeddings. By default, semantic storage/search runs in-memory (`InMemoryVectorCache`). For persistence and scale, ingest into an external vector DB (e.g., Pinecone, Weaviate, Qdrant, Chroma).

### Workflow
1. Collect documents or canonical Q&A responses.
2. Chunk long texts (by sentence, tokens, or structure) to 100-500 tokens.
3. Generate embeddings for each chunk (OpenAI, HF, etc.).
4. Upsert vectors with metadata into your vector DB.
5. At query-time, embed the query and run a similarity search; map the result back to your stored LLM responses.

### Embeddings
- Provider: `EMBEDDING_PROVIDER=openai|huggingface`
- Model: `EMBEDDING_MODEL`

### Example script
Use the provided example:

```bash
bun run scripts/ingest-example.ts
```

Key code:
```ts
// scripts/ingest-example.ts
// - chunkText(): naive chunking
// - embedBatch(): OpenAI/HF embeddings
// - upsertPinecone(): Pinecone REST upsert
```

### Pinecone schema
- Each vector: `{ id: string, values: number[], metadata?: Record<string, any> }`
- Recommended metadata: `{ source, parentId, title, category, tags, timestamp }`
- Namespace per domain or customer if needed.

### Weaviate/Qdrant/Chroma
- Weaviate: store as `class` objects with vector and properties.
- Qdrant: `points` with `vector` and `payload`.
- Chroma: `collection.add(documents, metadatas, ids, embeddings)`.

### Query-time
1. Compute query embedding.
2. Search top-k in your vector DB (threshold and filters as needed).
3. Retrieve stored responses for the matched entry/query.
4. Apply variant selection (`random|round-robin|deterministic|weighted`).

### Mapping between vector DB and responses
- You can store your `CachedLLMEntry` in your own DB (e.g., Postgres) and link it via the vector metadata `entryId` or `query`.
- Alternatively, call `/api/semantic/store` to populate the in-memory vector cache during boot, then rely on your external vector DB for search.

### Example request: store entries
```bash
curl -X POST http://localhost:3000/api/semantic/store \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{
    "query": "thank you",
    "query_embedding": { "vector": [0.1,0.2,0.3], "dimension": 3 },
    "responses": [ { "id": "resp1", "text": "You're welcome!" } ],
    "variant_strategy": "weighted",
    "weights": [1]
  }'
```

### Example request: search
```bash
curl -X POST http://localhost:3000/api/semantic/search \
  -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{
    "query": "merci",
    "query_embedding": { "vector": [0.11,0.19,0.29], "dimension": 3 },
    "limit": 3,
    "similarity_threshold": 0.7
  }'
```

### Notes
- The in-memory vector store is process-local; it resets on restart.
- For production-grade semantic search, prefer an external vector DB.
- Keep embedding dimension consistent across your pipeline.
