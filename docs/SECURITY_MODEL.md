## Security Model

### Principles
- Secrets are server-only (environment variables or a secret manager). No secrets in the frontend.
- Enforce TLS for all traffic. JWTs are short-lived; rate-limit per user and per IP.
- Optional cache-at-rest encryption using AES-GCM; recommended when persisting sensitive data.
- Structured logs with a correlation-id, plus metrics and traces for debugging and forensics.

### Authentication and authorization
- All `/api/*` endpoints require a valid JWT. Validate algorithm, expiration (`exp`), not-before (`nbf`), and issued-at (`iat`).
- Optionally validate `aud`/`iss` and implement simple scopes if needed.

### Input hardening
- Strict runtime validation via Zod schemas. Enforce maximum sizes and sanitize inputs.

### Rate limiting
- Sliding window (default 15 minutes) with per-identity and per-IP ceilings to mitigate abuse.

### Data protection
- AES-GCM encryption for cached values when `CACHE_ENCRYPTION_KEY` is set (32 bytes, base64).
- Keys derived using strong KDFs; prefer server-side HMAC for cache key generation when needed.

### Observability
- Prometheus metrics exposed at `/api/metrics` and OpenTelemetry tracing via OTLP.
- Use dashboards and alerts (latency, error rate, cache hit rate) to maintain SLOs.

