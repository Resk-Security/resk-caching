export type AppConfig = {
  server: {
    port: number;
  };
  security: {
    jwt: {
      // For demo: use HS256 secret via env; production should use JWKS/KMS
      secret: string | null;
      audience?: string | null;
      issuer?: string | null;
    };
    encryption: {
      // Base64-encoded 32-byte key for AES-256-GCM. If null, encryption is disabled.
      cacheKeyBase64: string | null;
    };
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
};

export function loadConfig(): AppConfig {
  const port = Number(Bun.env.PORT ?? 3000);
  return {
    server: { port: Number.isFinite(port) ? port : 3000 },
    security: {
      jwt: {
        secret: Bun.env.JWT_SECRET ?? null,
        audience: Bun.env.JWT_AUD ?? null,
        issuer: Bun.env.JWT_ISS ?? null,
      },
      encryption: {
        cacheKeyBase64: Bun.env.CACHE_ENCRYPTION_KEY ?? null,
      },
    },
    rateLimit: {
      windowMs: Number(Bun.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
      max: Number(Bun.env.RATE_LIMIT_MAX ?? 1000),
    },
  };
}


