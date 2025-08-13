## Sécurité — resk-caching

### Signalement de vulnérabilités
- Veuillez ouvrir un ticket privé ou contacter l’équipe via le canal convenu. N’exposez pas d’extraits de secrets en public.

### Gestion des secrets
- Aucun secret dans le code ou dans le frontend. Utilisez des variables d’environnement ou un gestionnaire de secrets (Vault/KMS/SSM).
- Rotation régulière des clés et segmentation par environnement/tenant.

### Chiffrement
- Transport: TLS obligatoire entre toutes les surfaces.
- Cache: chiffrement AES‑GCM activable via `CACHE_ENCRYPTION_KEY` (32 octets base64).

### Authentification & Autorisation
- JWT obligatoires pour `/api/*`. Validez `alg`, `exp/nbf/iat`, audience/issuer si utilisés.
- Rate limiting configuré pour limiter les abus; ajustez selon votre menace/charge.

### Dépendances & CI
- Audit régulier (CVE/licences). Générer un SBOM et activer SAST/DAST en CI.

### Politique de divulgation
- Responsable et coordonnée; délais de correctifs communiqués au besoin.


