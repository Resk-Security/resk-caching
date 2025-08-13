export type VariantStrategy = "random" | "round-robin" | "deterministic" | "weighted";

export type VariantItem = { id?: string } & Record<string, unknown>;

export type VariantSelectionInput = {
  strategy?: VariantStrategy;
  variants: VariantItem[];
  weights?: number[];
  seed?: string | number | null;
  roundRobinIndexProvider?: () => Promise<number> | number;
};

export function hashToInt(input: string): number {
  // Simple FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export async function selectVariant(input: VariantSelectionInput): Promise<{ variant: VariantItem; index: number } | null> {
  const { variants } = input;
  if (!variants || variants.length === 0) return null;
  const n = variants.length;
  const strategy = input.strategy ?? "random";

  if (strategy === "random") {
    const idx = Math.floor(Math.random() * n);
    return { variant: variants[idx]!, index: idx };
  }

  if (strategy === "deterministic") {
    const seedStr = String(input.seed ?? "");
    const idx = Math.abs(hashToInt(seedStr)) % n;
    return { variant: variants[idx]!, index: idx };
  }

  if (strategy === "round-robin") {
    const provider = input.roundRobinIndexProvider;
    let i = 0;
    if (provider) {
      const v = await provider();
      i = typeof v === "number" ? v : 0;
    }
    const idx = i % n;
    return { variant: variants[idx]!, index: idx };
  }

  if (strategy === "weighted") {
    const weights = input.weights && input.weights.length === n ? input.weights : new Array(n).fill(1);
    let total = 0;
    for (const w of weights) total += Math.max(0, Number(w) || 0);
    if (total <= 0) {
      const idx = Math.floor(Math.random() * n);
      return { variant: variants[idx]!, index: idx };
    }
    let r = Math.random() * total;
    for (let i = 0; i < n; i++) {
      r -= Math.max(0, Number(weights[i]) || 0);
      if (r <= 0) return { variant: variants[i]!, index: i };
    }
    const idx = n - 1;
    return { variant: variants[idx]!, index: idx };
  }

  // default fallback
  const idx = Math.floor(Math.random() * n);
  return { variant: variants[idx]!, index: idx };
}


