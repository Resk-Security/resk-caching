## Resk-Caching (Bun) — Secure caching and vector-friendly backend

Resk-Caching is a Bun-based backend library/server for secure caching, embeddings orchestration, and vector DB access. It emphasizes security (no secrets in frontend), performance, and observability.

### Features
- Cache backends: in-memory, SQLite (local persistence), Redis (multi-instance).
- AES-GCM encryption for cache-at-rest (optional via env key).
- JWT-protected API with rate limiting.
- OpenAPI 3.1 generated from Zod (single source of truth).
- Prometheus metrics and OpenTelemetry tracing.
- WebSockets for real-time event fan-out; optional Redis pub/sub complement.

### What each module is for
- Caching backends: choose between low-latency memory, local persistence (SQLite), or distributed (Redis).
- AES-GCM encryption: protects cached payloads at rest with authenticated encryption.
- JWT + rate-limiting: API protection and abuse prevention.
- Zod + OpenAPI: runtime validation and always-in-sync API contracts and examples.
- Prometheus + OpenTelemetry: real-time insight into perf, reliability, and request flows.
- WebSockets + Redis pub/sub: instant fan-out to clients and multi-instance event distribution.

### Install
```bash
# with npm (library)
npm install resk-caching

# with bun (library)
bun install resk-caching
```

### Quick start (server)
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

### Environment variables
- PORT (default 3000)
- JWT_SECRET
- CACHE_BACKEND = memory | sqlite | redis
- REDIS_URL (for redis backend)
- CACHE_ENCRYPTION_KEY (base64, 32 bytes)
- RATE_LIMIT_WINDOW_MS (default 900000)
- RATE_LIMIT_MAX (default 1000)
- OTEL_EXPORTER_OTLP_ENDPOINT (traces), OTEL_SERVICE_NAME

### Endpoints
- GET /health
- POST /api/cache (JWT)
- POST /api/cache/query (JWT)
- DELETE /api/cache (JWT)
- GET /api/openapi.json (OpenAPI 3.1 from Zod)
- GET /api/metrics (Prometheus exposition)
 
### Variants (A/B, randomized responses)
- You can cache an object with variants and an optional selection strategy, for example:
  - `{ variants: [{text: "You're welcome"}, {text: "My pleasure"}, {text: "No problem"}], variantStrategy: "deterministic", weights: [3,1,1], seed: "userId:conversationId" }`
- Server-side selection strategies:
  - `random`: uniform random
  - `round-robin`: cycles; uses Redis INCR if available
  - `deterministic`: stable by seed (user/conversation)
  - `weighted`: weighted random according to `weights`

### Why OpenAPI synced with Zod?
- Single source of truth for validation and API contract → fewer bugs and better DX.
- Up-to-date docs and typed clients generation.

### Why OpenTelemetry and Prometheus?
- Measure p50/p95/p99 latencies, error rates, throughput.
- Correlate logs, traces, and metrics for faster debugging and reliable SLOs.

### License
Apache-2.0 — see LICENSE.

## Technical specifications (English)

### 1) Goals and constraints
- Primary goal: provide a backend server/library (Bun runtime) to cache chatbot responses and orchestrate calls to vector databases and embedding services without exposing API keys to the frontend.
- Key constraint: all sensitive logic (API keys, encryption, connections to third-party services) stays on the backend. The frontend only sends HTTPS requests authenticated with JWT.
- Benefits: stronger security, lower costs via caching and batching, multi-provider compatibility, clear separation of concerns.

### 2) Functional scope
- Caching
  - In-memory (process) and optional persistent caches (SQLite local, Redis distributed).
  - Stable cache keys from canonicalized request content.
  - Per-entry TTL with default policy; full purge endpoint.
- Vector DB integrations
  - Adapters: Chroma, Pinecone, Weaviate, Milvus, and custom.
  - Minimal ops: initialize, upsert/insert documents, similarity query.
  - Environment-based configuration (URLs, keys, indexes/collections, timeouts).
- Embeddings
  - Providers supported: Hugging Face, OpenAI, SentenceTransformers via adapters.
  - Batching, retries/backoff, timeouts.
- Backend API
  - Create/write cache; read; clear.
- Security
  - JWT auth (short-lived), at-rest encryption (AES-GCM) optional, HTTPS, strict input validation and hardened headers.
- Operations & cost
  - Rate-limiting per user/IP; structured logging of latency, cache hit rate, errors.

### 3) Exigences non fonctionnelles
- **Performance**
  - Réponse < 100 ms pour un hit cache (hors réseau externe).
  - Réponse < 200 ms pour une requête avec base vectorielle (dépendant du réseau et du fournisseur).
  - Batching des embeddings pour minimiser la latence et les coûts.
- **Sécurité**
  - Clés API et secrets en variables d’environnement, jamais transmis au frontend.
  - TLS obligatoire pour toutes les communications.
  - Chiffrement des données sensibles au repos dans le cache persistant.
  - Protection contre injections, XSS indirectes via API, et abus d’API (rate limit).
  - Conformité RGPD: minimisation des données, rétention limitée, droit à l’effacement.
- **Compatibilité**
  - Node.js 18+.
  - Frontends variés (SPA/SSR) via appels HTTPS standards.
- **Qualité & Maintenabilité**
  - Couverture de tests ≥ 90% (unitaires, intégration, performance).
  - Linting et formatage systématiques.
  - Documentation API et guides d’intégration.

### 4) Architecture logique
- **Frontend minimal**
  - Ne détient aucune clé sensible.
  - Obtient un JWT court-terme depuis une identité amont (hors périmètre de ce document) et appelle le backend en HTTPS.
- **Service API backend**
  - Expose des endpoints de cache et de requête.
  - Orchestration: validation → auth → rate limit → cache → embeddings → base vectorielle → réponse.
- **Cache**
  - Couche 1: en mémoire (process) pour temps d’accès minimal.
  - Couche 2: Redis (optionnel) pour persistance et partage multi-instances.
  - Données stockées sous forme chiffrée avec métadonnées (TTL, date de création, version de schéma).
- **Adaptateurs embeddings**
  - Interface commune: initialisation, vectorisation (mono/lot), gestion des erreurs et des timeouts.
  - Sélection du fournisseur via configuration.
- **Adaptateurs bases vectorielles**
  - Interface commune: initialisation/connexion, upsert/insert, requête de similarité avec paramètres (k, seuil).
  - Gestion des authentifications propres à chaque fournisseur.
- **Sécurité transverse**
  - AuthN: JWT vérifié sur chaque requête, horodatage, expiration courte, rotation possible du secret.
  - AuthZ: contrôle basique par audience/scope si nécessaire.
  - Input hardening: schémas de validation, nettoyage, tailles maximales.
  - HTTP hardening: en-têtes de protection et désactivation des vecteurs connus.
- **Observabilité**
  - Logs structurés (corrélation par identifiant de requête), niveaux, journaux d’audit.
  - Métriques clés: latence globale, latence par couche, taux de hit/miss, volume et coûts estimés.

### 5) Flux de traitement type (lecture)
1. Le frontend envoie une requête HTTPS authentifiée par JWT vers l’endpoint de requête.
2. Le backend valide et normalise l’entrée (texte, langue, options).
3. Calcul de la clé de cache et recherche dans le cache mémoire ; en cas d’échec, fallback vers Redis si activé.
4. Si hit, déchiffrement et réponse immédiate.
5. Si miss, calcul ou récupération d’embeddings, puis interrogation de la base vectorielle (si configurée) selon les paramètres (k, seuil).
6. Mise en cache de la réponse (chiffrée) avec TTL.
7. Retour au frontend avec métadonnées de provenance (cache hit/miss, latences).

### 6) API backend (contrats)
- **Authentification**: en-tête d’autorisation par jeton (porteur), jetons à courte durée, audience/scope optionnels.
- **Encodage**: JSON en entrée/sortie.
- **Erreurs**: format d’erreur structuré avec code, message, détails de validation.

1. Lecture/Query
   - Méthode: POST.
   - Ressource: chemin de requête « query ».
   - Entrées minimales: texte de requête obligatoire; options: langue, paramètres embeddings, paramètres vectoriels (k, seuil), forcer recalcul, TTL personnalisé.
   - Sorties: objet résultat, indicateurs de cache (hit/miss), latences par couche, source (cache/vectorDB).
   - Codes: 200 succès, 400 validation, 401 non autorisé, 429 limite atteinte, 5xx erreurs internes ou fournisseurs.

2. Écriture/Put en cache
   - Méthode: POST.
   - Ressource: chemin de cache.
   - Entrées: texte/clé logique, contenu à mettre en cache (objet sérialisable), TTL optionnel.
   - Sorties: indicateur de succès, TTL effectif, horodatage d’expiration.
   - Codes: 200/201 succès, 400 validation, 401 non autorisé, 5xx erreurs.

3. Vidage du cache
   - Méthode: DELETE.
   - Ressource: chemin de cache.
   - Entrées: aucune (ou filtre de scope si implémenté).
   - Sorties: indicateur de succès, nombre d’entrées purgées si disponible.
   - Codes: 200 succès, 401 non autorisé, 5xx erreurs.

### 7) Schémas de données (conceptuels)
- **Clé de cache**: hachage cryptographique de la requête normalisée (texte nettoyé, langue, paramètres significatifs).
- **Valeur de cache**: contenu chiffré contenant la réponse, le schéma de version, les métadonnées de latence et d’origine.
- **Entrée vectorielle**: document/fragment (texte, métadonnées, identifiant stable), vecteur d’embedding associé.
- **Résultat vectoriel**: liste ordonnée d’éléments avec score de similarité et métadonnées.

### 8) Sécurité et conformité
- **Stockage des secrets**: exclusivement en variables d’environnement; aucune clé dans le code ou le frontend.
- **Transport**: TLS pour toutes les surfaces (frontend → backend, backend → fournisseurs tiers).
- **Chiffrement au repos**: chiffrement des valeurs de cache; algorithme fort (mode authentifié), clé dérivée de secrets et salée.
- **JWT**: signature robuste, durée de vie courte, validation de l’horloge, rotation possible; revocation par liste si nécessaire.
- **Validation entrée**: types, longueur max, encodage, interdiction des caractères et schémas dangereux.
- **Rate limiting**: fenêtre glissante 15 min, plafond par utilisateur (ex: 1000) et par IP en secours.
- **Audit**: trace d’accès, anomalies, verrouillage progressif en cas d’abus.
- **RGPD**: minimisation, durées de rétention courtes, export/suppression sur demande.

### 9) Intégrations techniques
- **Embeddings**
  - Paramètres configurables: modèle, taille de lot, timeout, nombre de tentatives/retry avec backoff.
  - Compatibilité: fournisseurs via API HTTP ou SDK officiels.
- **Bases vectorielles**
  - Paramètres: URL/endpoint, clé/jeton, nom d’index/collection, dimension de vecteur, métrique (cosine/L2/dot), k et seuil par défaut.
  - Capacité: upsert/insert en lot, requêtes nearest-neighbors, filtres par métadonnées.

### 10) Configuration par environnement (exemples de variables)
- Serveur: port d’écoute, environnement (développement/production), activation HTTPS, chemins de certificats.
- Sécurité: secret JWT, paramètres de rotation, configuration des en-têtes de sécurité.
- Cache: activation mémoire, hôte/port Redis, TTL par défaut, tailles maximales et stratégies de purge.
- Embeddings: activation et clés/fournisseurs, modèle par défaut, limites de lot/timeout.
- Vector DB: type d’adaptateur, endpoints, clés, index/collections, métrique, dimension, timeouts.
- Rate limiting: fenêtre en ms, plafond de requêtes par identifiant, stratégies d’exception.
- Journalisation: niveau de logs, format structuré, corrélation, destinations (fichier/console/agrégateur).

### 11) Observabilité et exploitation
- **Journalisation**: niveaux (erreur, alerte, info, debug), correlation-id par requête, champs normalisés (latences, hit/miss, tailles, fournisseurs appelés).
- **Métriques**: latence P50/P95/P99, taux de hit cache, erreurs par catégorie, coût estimé par fournisseur, QPS.
- **Alertes**: sur dérive du taux de hit, latence, taux d’erreur, dépassement de quotas fournisseurs.
- **SLA/SLO**: disponibilité service > 99.9%, latence médiane < 100 ms pour cache.

### 12) Tests et qualité
- **Unitaires**: cache (clé/TTL/chiffrement), adaptateurs embeddings, adaptateurs vectoriels, validation schémas.
- **Intégration**: parcours complet (miss → embeddings → vectorDB → mise en cache → hit), erreurs fournisseurs, timeouts.
- **Performance**: charge soutenue, profils de latence, mesure du taux de hit et efficacité du batching.
- **Couverture**: ≥ 90% lignes/branches/fonctions.

### 13) Déploiement et exploitation
- **Environnements**: développement, staging, production, configurations isolées.
- **Sécurité du déploiement**: gestion des secrets par magasin sécurisé, rotation périodique, contrôle d’accès aux artefacts.
- **Réseau**: reverse proxy optionnel, limitation d’origine (CORS paramétrable), pare-feu egress pour fournisseurs.
- **Scalabilité**: processus multiples/containers, partage via Redis, readiness/liveness checks.
- **Mise à jour**: déploiements progressifs, rollback documenté, compatibilité ascendante des schémas cache/vectoriels.

### 14) Publication et documentation
- **Distribution**: paquet côté serveur publiable (registre privé/public) sous le nom prévu.
- **Guides**: intégration frontend (auth, appels), configuration fournisseurs, exploitation (logs/metrics), sécurité.
- **CI/CD**: pipeline avec lint, tests, build, publication conditionnelle, scans de sécurité.

### 15) Plan de mise en œuvre (indicatif)
- **Durée**: 10 à 12 semaines.
- **Jalons**
  - S1–S2: socle serveur, configuration, journalisation, sécurité de base (TLS, JWT, validation).
  - S3–S5: cache (mémoire/Redis), adaptateurs embeddings et bases vectorielles, flux end-to-end.
  - S6–S8: durcissement sécurité (rate limit, en-têtes, chiffrement au repos), observabilité avancée.
  - S9–S10: tests complets, optimisation performance/coûts, stabilisation.
  - S11–S12: documentation finale, préparation publication/industrialisation.

### 16) Critères d’acceptation
- Aucun secret en frontend; toutes les communications chiffrées; JWT vérifiés systématiquement.
- Taux de hit du cache conforme aux attentes sur corpus cible; latence dans les bornes annoncées.
- Adaptateurs de référence opérationnels (au moins un fournisseur embeddings et une base vectorielle).
- Jeux de tests complets, couverture ≥ 90%, documentation à jour.


### 17) Sécurité avancée
- **Gestion des clés**: utilisation d’un KMS/HSM (ex: AWS KMS, GCP KMS) pour gérer et faire la rotation des clés; chiffrement par enveloppe; séparation des clés par tenant.
- **Algorithmes**: mode AEAD (ex: AES‑256‑GCM) pour le chiffrement au repos; HMAC pour authentifier les métadonnées; dérivation des clés via HKDF/Argon2 plutôt que PBKDF2.
- **JWT**: validation stricte de l’algorithme (RS256/ES256/HS256), vérification de `exp/nbf/iat` avec tolérance d’horloge; `jti` avec liste de révocation; rotation des clés via JWKS; limitation par `aud` et `scope`; durée de vie courte.
- **Menaces**: anti cache‑poisoning (signature interne des entrées), protection anti‑replay (nonce/idempotency), CORS restrictif (origines autorisées), mTLS pour trafics internes lorsque possible, durcissement des en‑têtes (CSP, COOP, COEP).
- **Secrets**: gestion centralisée (Vault/SSM); aucune persistance locale; ACL minimales sur Redis/Vector DB; réseau privé/PrivateLink lorsque disponible.

### 18) API et contrats formalisés
- **Spécification**: description complète en OpenAPI 3.1 incluant schémas d’entrée/sortie et d’erreurs.
- **Versionnement**: semver d’API, stratégie de dépréciation et fenêtre de support documentées.
- **Idempotence**: prise en charge d’un identifiant d’idempotence pour les écritures; pagination normalisée; limites strictes de taille d’entrée.
- **Normalisation**: processus documenté (lowercasing, Unicode NFC/NFKC, trimming, suppression de bruit) pour la construction des clés et la recherche.
- **Traçabilité**: `Correlation-Id` propagé; quotas/limites par tenant; réponses enrichies (hit/miss, latences par couche).

### 19) Stratégies de cache avancées et performance
- **Anti‑stampede**: singleflight/verrous pour empêcher la duplication de calculs; jitter sur TTL; stratégie stale‑while‑revalidate pour répondre vite puis actualiser.
- **Négatif**: negative caching configurable pour erreurs/transitoires contrôlé par codes et durée courte.
- **Écriture**: politiques write‑through vs write‑back documentées avec critères d’usage.
- **Redis**: politique d’éviction (LFU/LRU) explicite; sizing mémoire; persistance (AOF) et `fsync` adapté; cluster/Sentinel pour HA; chiffrement en transit (TLS) et au repos.
- **Clés**: HMAC‑SHA‑256 avec secret de service pour la génération de clés de cache; canonicalisation robuste (langue, modèle, paramètres significatifs).
- **Pré‑chauffage**: warm‑up des clés critiques; pré‑calcul et cache des embeddings pour corpus statiques.

### 20) Recherche vectorielle et embeddings avancés
- **Qualité**: hybrid search (sémantique + BM25), re‑ranking par cross‑encoder, diversification MMR.
- **Réglages ANN**: paramètres propres aux fournisseurs (ex: `efSearch`, `nprobe`, `efConstruction`) documentés et versionnés.
- **Versioning**: versions de modèles d’embedding, dimensions, normalisation; procédures de migration/reindex et gestion de drift.
- **Gouvernance**: conformité DSR (effacement), TTL des documents, anonymisation/PII scanning, champs de consentement, provenance et data lineage.

### 21) Résilience, SRE et observabilité avancée
- **Tolérance aux pannes**: timeouts budgétés par couche, retries avec backoff + jitter, circuit breakers, bulkheads, backpressure; modes dégradés si Vector DB indisponible.
- **SLI/SLO**: SLI définis (latences P50/P95/P99, taux de hit, 5xx, disponibilité) et SLO associés; alertes burn‑rate.
- **Observabilité**: instrumentation OpenTelemetry (traces, métriques, logs), exposition Prometheus, dashboards Grafana; centralisation des logs (ELK/Loki).

### 22) Tests avancés et sécurité applicative
- **Tests**: tests de contrat API, property‑based testing pour la construction de clés/normalisation, tests de charge/soak; tests de files/attentes et latence; chaos engineering (pannes Redis/Vector DB).
- **Sécurité**: SAST/DAST, SBOM (CycloneDX), scanning des dépendances (CVE/licences), détection de secrets en CI; fuzzing des endpoints critiques.

### 23) Déploiement, réseau et TLS
- **Conteneurs/K8s**: images minimales non‑root, système de fichiers read‑only, probes liveness/readiness, HPA déclenché par QPS/latence, anti‑affinity; stratégies blue/green ou canary.
- **Réseau**: WAF et rate limiting L7 côté edge, CDN pour assets si besoin; contrôle strict des egress (deny‑by‑default).
- **TLS**: gestion automatisée ACME/Let’s Encrypt, rotation des certificats, suites cryptographiques modernes conformes aux meilleures pratiques.

### 24) Multi‑tenant, quotas et coûts
- **Isolation**: partitionnement logique par tenant dans cache et Vector DB; chiffrement par clé dédiée par tenant.
- **Quotas**: limites de QPS et de coûts par tenant; métriques par tenant et alertes dédiées; mécanismes de throttling équitables.
- **Facturation interne**: comptabilisation des usages (embeddings, requêtes, stockage) et refacturation si nécessaire.

### 25) Documentation, conformité et gouvernance

### Annexe A — Démarrage rapide avec Bun (squelette de projet)
- Prérequis: Bun installé.
- Installation (Windows PowerShell):
  - Téléchargez depuis `https://bun.sh` et suivez l’installateur, ou utilisez `powershell -c "irm bun.sh/install.ps1 | iex"`.
- Commandes:
  - `bun install` pour installer les dépendances.
  - `bun run dev` pour lancer en mode watch.
  - `bun run start` pour lancer le serveur.
  - `bun test` pour exécuter les tests.
- Variables d’environnement:
  - `PORT` (par défaut 3000)
  - `JWT_SECRET` (obligatoire pour authentifier les endpoints `/api/*`)
  - `LOG_LEVEL` (ex: info, debug)
  - `CACHE_BACKEND` (values: `memory` [par défaut], `sqlite`, `redis`)
  - `REDIS_URL` (si `CACHE_BACKEND=redis`, sinon ignoré). Exemple: `redis://user:pass@localhost:6379` ou `rediss://...` pour TLS
  - `CACHE_ENCRYPTION_KEY` (base64, 32 octets) pour activer le chiffrement AES‑GCM des valeurs de cache
  - `RATE_LIMIT_WINDOW_MS` (par défaut 900000), `RATE_LIMIT_MAX` (par défaut 1000)
- Endpoints clés:
  - `GET /health` (sans auth)
  - `POST /api/cache` (JWT requis)
  - `POST /api/cache/query` (JWT requis)
  - `DELETE /api/cache` (JWT requis)
  - `GET /api/openapi.json` (spécification OpenAPI minimaliste)
  - `GET /api/metrics` (exposition Prometheus text/plain)

### Annex B — Observability (English)
- **Prometheus metrics**: counters and histograms exposed at `/api/metrics` (ms latency, HTTP requests, cache hit/miss). Plug this into Prometheus/Grafana.
- **OpenTelemetry tracing**: spans are emitted via OTLP HTTP exporter. Configure `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_SERVICE_NAME`.
- **Correlation-ID**: `x-correlation-id` header propagates across responses for easier debugging.

### Annex C — WebSockets (English)
- WebSocket handler is enabled in the server. Minimal protocol:
  - Subscribe: `{ "type": "subscribe", "channel": "events" }`
  - Publish: `{ "type": "publish", "channel": "events", "data": { ... } }`
- This complements Redis pub/sub if you want to fan-out to browsers directly.

## Technical specifications (English)

### Functional scope
- Caching: in-memory, SQLite (local persistence), Redis (distributed); per-entry TTL; canonical cache keys; purge endpoint.
- Vector DB: adapters pattern (Chroma, Pinecone, Weaviate, Milvus); operations: init, upsert/insert, similarity query.
- Embeddings: OpenAI and Hugging Face supported; batching, retries, timeouts; configurable model per env.
- API: JWT-protected endpoints to write, query, and clear cache; OpenAPI 3.1 served at `/api/openapi.json`.
- Security: secrets in env only, HTTPS, input validation/hardening, optional AES-GCM at-rest encryption.
- Ops: rate-limiting, structured logs with correlation-id, Prometheus metrics, OpenTelemetry tracing.

### Non-functional
- Performance: <100 ms for cache hits, <200 ms for vector lookups (network-dependent) as targets.
- Maintainability: TypeScript strict, tests, CI/CD workflow for npm publish, Apache-2.0.
- Compliance: data minimization, short retention for cache, documented deletion flows.

### Ingestion (batch embeddings + vector upsert)
- Example script: `scripts/ingest-example.ts`
- Configure env:
  - Embeddings: `EMBEDDING_PROVIDER=openai|huggingface`, `EMBEDDING_MODEL`, and matching API key.
  - Pinecone: `VECTORDB_TYPE=pinecone`, `PINECONE_API_KEY`, `PINECONE_INDEX_HOST=https://...`
  - Optional: `BATCH_SIZE`, `UPSERT_BATCH`.
- Run: `bun run scripts/ingest-example.ts`

### CI/CD (GitHub Actions)
- Workflow `.github/workflows/npm-publish.yml` runs tests on push/PR and publishes on version tags (`v*`) using `NPM_TOKEN`.

