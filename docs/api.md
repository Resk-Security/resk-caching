## API

All authenticated endpoints expect `Authorization: Bearer <token>`.

### Health
```
GET /health
```

### Core cache
```
POST /api/cache        # store key-value
POST /api/cache/query  # retrieve by key
DELETE /api/cache      # clear all
```

### Semantic
```
POST /api/semantic/store    # store responses with embeddings
POST /api/semantic/search   # search by query+embedding
GET  /api/semantic/responses?query=...  # list stored responses for a query
GET  /api/semantic/stats     # stats and performance
```

### Observability
```
GET /api/openapi.json
GET /api/metrics
```

See `docs/USAGE.md` for end-to-end examples and curl snippets.
