import { loadConfig } from "../shared/config";

const cfg = loadConfig();

function getKey(): CryptoKey | null {
  const base64 = cfg.security.encryption.cacheKeyBase64;
  if (!base64) return null;
  const raw = Buffer.from(base64, "base64");
  if (raw.byteLength !== 32) throw new Error("CACHE_ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]) as unknown as CryptoKey;
}

let cachedKeyPromise: Promise<CryptoKey | null> | null = null;
async function getOrCreateKey(): Promise<CryptoKey | null> {
  if (!cachedKeyPromise) {
    cachedKeyPromise = (async () => getKey())();
  }
  return cachedKeyPromise;
}

export async function encryptForCache(plain: unknown): Promise<string | null> {
  const key = await getOrCreateKey();
  if (!key) return JSON.stringify({ _v: 1, clear: plain });
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(plain));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  const packed = new Uint8Array(iv.byteLength + cipher.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(cipher), iv.byteLength);
  return Buffer.from(packed).toString("base64");
}

export async function decryptFromCache(ciphertext: string): Promise<unknown | null> {
  try {
    // Backward compatible: if value is a JSON string with {_v, clear} return clear
    const maybe = JSON.parse(ciphertext);
    if (maybe && typeof maybe === "object" && "_v" in maybe && "clear" in maybe) {
      return (maybe as { clear: unknown }).clear;
    }
  } catch {
    // not JSON; assume encrypted base64
  }

  const key = await getOrCreateKey();
  if (!key) return null;
  const packed = Buffer.from(ciphertext, "base64");
  const iv = packed.slice(0, 12);
  const data = packed.slice(12);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, data);
  const json = new TextDecoder().decode(plainBuf);
  return JSON.parse(json);
}


