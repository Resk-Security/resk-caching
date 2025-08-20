## Deployment

### Docker

Build and run:
```bash
docker build -t resk-caching:latest .

docker run --rm -p 3000:3000 \
  -e JWT_SECRET=change_me \
  -e CACHE_BACKEND=redis \
  -e REDIS_URL=redis://redis:6379 \
  -e CACHE_ENCRYPTION_KEY=base64_32_bytes_key \
  --name resk-caching resk-caching:latest
```

Kubernetes (snippet):
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: resk-caching
spec:
  replicas: 2
  selector:
    matchLabels: { app: resk-caching }
  template:
    metadata:
      labels: { app: resk-caching }
    spec:
      containers:
        - name: server
          image: ghcr.io/resk-security/resk-caching:latest
          ports: [{ containerPort: 3000 }]
          env:
            - { name: JWT_SECRET, valueFrom: { secretKeyRef: { name: resk-secrets, key: jwt } } }
            - { name: CACHE_BACKEND, value: redis }
            - { name: REDIS_URL, value: redis://redis:6379 }
            - { name: CACHE_ENCRYPTION_KEY, valueFrom: { secretKeyRef: { name: resk-secrets, key: cacheKey } } }
          readinessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 10
            periodSeconds: 20
```

### Configuration
- `PORT` (default 3000)
- `JWT_SECRET` (required for protected endpoints)
- `CACHE_BACKEND` = `memory|sqlite|redis`
- `REDIS_URL` when using Redis
- `CACHE_ENCRYPTION_KEY` base64 32 bytes to encrypt at rest (key-value cache backends)
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`
- `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`

### Notes
- For SQLite, mount a volume to persist `resk-cache.sqlite`.
- For Redis, prefer a managed service or a StatefulSet.
- Distroless runtime is used; logs go to stdout.
