## Usage

### As a server (recommended for hiding secrets)
1. Set env vars (`JWT_SECRET`, `CACHE_BACKEND`, etc.)
2. Start: `npm run build && bun run dev`
3. Call the API with a short-lived JWT

### As a library
```ts
import { selectCache } from "resk-caching";

const cache = selectCache();
await cache.set("key", { payload: true }, 60);
const val = await cache.get("key");
```

### OpenAPI and clients
- Fetch the spec: `GET /api/openapi.json`
- Use your preferred OpenAPI generator to produce clients/SDKs.


