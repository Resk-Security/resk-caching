## Security – resk-caching

### Reporting vulnerabilities
- Please report security issues responsibly to: contact@resk.fr
- Do not publicly share secrets or proof-of-concept exploits. If needed, request a secure channel to exchange sensitive details.

### Supported versions
- We target the latest main branch and the most recent tagged releases. Critical fixes may be backported at our discretion.

### Secrets management
- Never commit secrets; never expose them in the frontend. Store secrets in environment variables or a secret manager (Vault/KMS/SSM).
- Rotate keys regularly and segregate by environment and tenant when applicable.

### Transport and data protection
- Enforce TLS for all network traffic.
- Optional cache-at-rest encryption via AES-GCM enabled by `CACHE_ENCRYPTION_KEY` (32 bytes, base64).

### Authentication and authorization
- JWT is required for `/api/*`. Validate `alg`, `exp/nbf/iat`, and audience/issuer if applicable.
- Rate limiting is enabled to protect against abuse. Tune thresholds to your threat model.

### Dependencies and CI hardening
- Perform regular dependency audits and license checks. Maintain an SBOM.
- Enable SAST/DAST and secret scanning in CI.

### Coordinated disclosure policy
- We follow responsible disclosure and will coordinate timelines for fixes and advisories.

