import type { CacheBackend } from "./types";

type Row = { key: string; value: string; expiresAt: number | null };

export class SqliteCache implements CacheBackend {
  // Use minimal structural typing to avoid 'any'
  private db: { run: (...args: unknown[]) => unknown; query: (...args: unknown[]) => { get: (...args: unknown[]) => Row | null } } | null = null;

  constructor(private readonly path: string = "resk-cache.sqlite") {}

  private ensureDb(): { run: (...args: unknown[]) => unknown; query: (...args: unknown[]) => { get: (...args: unknown[]) => Row | null } } {
    if (this.db) return this.db;
    // Bun exposes SQLite via Bun.sqlite
    const sqlite = (Bun as unknown as { sqlite?: { Database: new (path: string) => unknown } | undefined }).sqlite;
    if (!sqlite) throw new Error("SQLite not available in this Bun runtime");
    const db = new (sqlite.Database as new (path: string) => { run: (...args: unknown[]) => unknown; query: (...args: unknown[]) => { get: (...args: unknown[]) => Row | null } })(this.path);
    db.run(
      "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL, expiresAt INTEGER)"
    );
    // Types are not perfect; keep as any internally
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.db = db as any;
    return this.db;
  }

  async get(key: string): Promise<unknown | null> {
    const db = this.ensureDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: Row | null = (db as any).query(
      "SELECT key, value, expiresAt FROM kv WHERE key = ?"
    ).get(key);
    if (!row) return null;
    if (row.expiresAt !== null && row.expiresAt < Date.now()) {
      await this.delete(key);
      return null;
    }
    try {
      return JSON.parse(row.value);
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const db = this.ensureDb();
    const payload = JSON.stringify(value);
    const expiresAt = typeof ttlSeconds === "number" ? Date.now() + ttlSeconds * 1000 : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).run(
      "INSERT INTO kv(key, value, expiresAt) VALUES(?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expiresAt = excluded.expiresAt",
      key,
      payload,
      expiresAt,
    );
  }

  private async delete(key: string): Promise<void> {
    const db = this.ensureDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).run("DELETE FROM kv WHERE key = ?", key);
  }

  async clear(): Promise<void> {
    const db = this.ensureDb();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (db as any).run("DELETE FROM kv");
  }
}

export const sqliteCache = new SqliteCache();


