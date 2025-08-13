## Resk-Caching (Bun) — Secure caching and vector-friendly backend

Resk-Caching is a Bun-based backend library/server for secure caching, embeddings orchestration, and vector DB access. It emphasizes security (no secrets in the frontend), performance, and observability.

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

See docs for details:
- docs/USAGE.md
- docs/SECURITY_MODEL.md

## CI/CD
GitHub Actions workflow in `.github/workflows/ci.yml` runs type check, lint, build, and tests with Bun on:
- pushes to `main`/`master`
- pull requests
- version tags matching `v*`

## License
Apache-2.0 — see LICENSE


