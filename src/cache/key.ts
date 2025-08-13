function canonicalize(input: { query: string }): string {
  const q = input.query
    .trim()
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, " ");
  return JSON.stringify({ q, v: 1 });
}

export function buildCacheKey(input: { query: string }): string {
  // Simple stable key for skeleton. Future: HMAC with secret.
  return `rc:${canonicalize(input)}`;
}


