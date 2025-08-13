## Security Model

- Secrets live on the server only (env/secret manager). No secrets in frontend.
- Transport over TLS; JWT short-lived; rate-limit per user/IP.
- Cache encryption (AES-GCM) optional but recommended when persisting data.
- Auditing and correlation-id in logs; metrics and traces for forensic analysis.


