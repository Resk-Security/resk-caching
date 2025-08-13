type Counter = { name: string; help?: string; values: Map<string, number> };
type Histogram = { name: string; help?: string; buckets: number[]; counts: Map<string, number[]>; sum: Map<string, number> };

const counters = new Map<string, Counter>();
const histograms = new Map<string, Histogram>();

function labelsKey(labels: Record<string, string | number | boolean>): string {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${v}`).join(",");
}

export function counter(name: string, help?: string): Counter {
  let c = counters.get(name);
  if (!c) {
    c = { name, help, values: new Map() };
    counters.set(name, c);
  }
  return c;
}

export function histogram(name: string, buckets: number[], help?: string): Histogram {
  let h = histograms.get(name);
  if (!h) {
    h = { name, help, buckets: [...buckets].sort((a, b) => a - b), counts: new Map(), sum: new Map() };
    histograms.set(name, h);
  }
  return h;
}

export function inc(c: Counter, labels: Record<string, string | number | boolean> = {}, value = 1): void {
  const key = labelsKey(labels);
  c.values.set(key, (c.values.get(key) ?? 0) + value);
}

export function observe(h: Histogram, val: number, labels: Record<string, string | number | boolean> = {}): void {
  const key = labelsKey(labels);
  const arr = h.counts.get(key) ?? new Array(h.buckets.length + 1).fill(0);
  let placed = false;
  for (let i = 0; i < h.buckets.length; i++) {
    const upper = h.buckets[i] as number;
    if (val <= upper) {
      arr[i] += 1;
      placed = true;
      break;
    }
  }
  if (!placed) arr[h.buckets.length] += 1; // +Inf bucket
  h.counts.set(key, arr);
  h.sum.set(key, (h.sum.get(key) ?? 0) + val);
}

// Predefined metrics
const httpRequests = counter("http_requests_total", "Total HTTP requests");
const httpRequestDuration = histogram("http_request_duration_ms", [5, 10, 25, 50, 100, 200, 500, 1000, 2000], "HTTP request duration in ms");
const cacheHits = counter("cache_hits_total", "Cache hits");
const cacheMisses = counter("cache_misses_total", "Cache misses");

export function recordHttpRequest(labels: { method: string; route: string; status: number }): void {
  inc(httpRequests, labels);
}

export function recordHttpDuration(ms: number, labels: { method: string; route: string; status: number }): void {
  observe(httpRequestDuration, ms, labels);
}

export function recordCacheHit(labels: { route: string }): void {
  inc(cacheHits, labels);
}

export function recordCacheMiss(labels: { route: string }): void {
  inc(cacheMisses, labels);
}

export function renderPrometheus(): string {
  const lines: string[] = [];
  // Counters
  for (const c of counters.values()) {
    if (c.help) lines.push(`# HELP ${c.name} ${c.help}`);
    lines.push(`# TYPE ${c.name} counter`);
    for (const [k, v] of c.values.entries()) {
      const lbl = k ? `{${k}}` : "";
      lines.push(`${c.name}${lbl} ${v}`);
    }
  }
  // Histograms
  for (const h of histograms.values()) {
    if (h.help) lines.push(`# HELP ${h.name} ${h.help}`);
    lines.push(`# TYPE ${h.name} histogram`);
    for (const [k, counts] of h.counts.entries()) {
      let cum = 0;
      for (let i = 0; i < counts.length; i++) {
        const c = counts[i] as number;
        cum += c;
        const le = i < h.buckets.length ? h.buckets[i] : "+Inf";
        const base = k ? `${k},le="${le}"` : `le="${le}"`;
        lines.push(`${h.name}_bucket{${base}} ${cum}`);
      }
      const sum = h.sum.get(k) ?? 0;
      const count = counts.reduce((a, b) => a + b, 0);
      const lbl = k ? `{${k}}` : "";
      lines.push(`${h.name}_sum${lbl} ${sum}`);
      lines.push(`${h.name}_count${lbl} ${count}`);
    }
  }
  return lines.join("\n") + "\n";
}


