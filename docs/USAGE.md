## Usage

### Run as a server (recommended to keep secrets server-side)
1. Set environment variables (`JWT_SECRET`, `CACHE_BACKEND`, etc.)
2. Start: `npm run build && bun run dev`
3. Call the API with a short-lived JWT

Example requests:
```bash
curl -H "Authorization: Bearer test" \
     -H "Content-Type: application/json" \
     -d '{"query":"Hello","response":{"answer":"Hi"},"ttl":3600}' \
     http://localhost:3000/api/cache

curl -H "Authorization: Bearer test" \
     -H "Content-Type: application/json" \
     -d '{"query":"Hello"}' \
     http://localhost:3000/api/cache/query
```

### Use as a library
```ts
import { selectCache } from "resk-caching";

const cache = selectCache();
await cache.set("key", { payload: true }, 60);
const val = await cache.get("key");
```

### OpenAPI and clients
- Fetch the spec: `GET /api/openapi.json`
- Use any OpenAPI generator to produce clients/SDKs.

### Environment variables
- `PORT` (default 3000)
- `JWT_SECRET`
- `CACHE_BACKEND` = `memory` | `sqlite` | `redis`
- `REDIS_URL` (for Redis backend)
- `CACHE_ENCRYPTION_KEY` (base64, 32 bytes)
- `RATE_LIMIT_WINDOW_MS` (default 900000), `RATE_LIMIT_MAX` (default 1000)

