/*
 Example ingestion script (batch embeddings + vector DB upsert) for Resk-Caching.

 Supports:
 - Embeddings: OpenAI (recommended) or Hugging Face
 - Vector DB: Pinecone (via REST host). You can adapt for Chroma/Weaviate/Milvus.

 Environment variables:
   EMBEDDING_PROVIDER=openai|huggingface
   EMBEDDING_MODEL=your-model
   OPENAI_API_KEY=...
   HF_API_KEY=...
   VECTORDB_TYPE=pinecone
   PINECONE_API_KEY=...
   PINECONE_INDEX_HOST=https://<index-host>  (e.g. https://my-index-xxxx.svc.us-east1-aws.pinecone.io)
   BATCH_SIZE=64 (optional)

 Run:
   bun run scripts/ingest-example.ts
*/

type Doc = { id: string; text: string; meta?: Record<string, unknown> };

const provider = (Bun.env.EMBEDDING_PROVIDER ?? "openai").toLowerCase();
const model = Bun.env.EMBEDDING_MODEL ?? (provider === "openai" ? "text-embedding-3-small" : "sentence-transformers/all-MiniLM-L6-v2");
const batchSize = Number(Bun.env.BATCH_SIZE ?? 64);

// 1) Collect or define input documents
const sampleDocs: Doc[] = [
  { id: "doc-1", text: "Hello world. This is an example document.", meta: { source: "sample" } },
  { id: "doc-2", text: "Resk-Caching helps cache chatbot replies and integrate vector DBs.", meta: { source: "sample" } },
];

// 2) Chunking (naive: split by sentences/length). Replace by your tokenizer-based chunking if needed.
function chunkText(doc: Doc, maxLen = 300): Doc[] {
  const parts: Doc[] = [];
  const sentences = doc.text.split(/(?<=[.!?])\s+/);
  let cur = "";
  let idx = 0;
  for (const s of sentences) {
    if ((cur + " " + s).trim().length > maxLen && cur.length > 0) {
      parts.push({ id: `${doc.id}:${idx++}`, text: cur.trim(), meta: { ...(doc.meta ?? {}), parentId: doc.id } });
      cur = s;
    } else {
      cur = (cur + " " + s).trim();
    }
  }
  if (cur.length > 0) parts.push({ id: `${doc.id}:${idx++}`, text: cur.trim(), meta: { ...(doc.meta ?? {}), parentId: doc.id } });
  return parts;
}

function makeChunks(docs: Doc[]): Doc[] {
  return docs.flatMap((d) => chunkText(d));
}

// 3) Embeddings
async function embedOpenAI(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Bun.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI embeddings failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return (json.data as Array<{ embedding: number[] }>).map((x) => x.embedding);
}

async function embedHF(texts: string[]): Promise<number[][]> {
  // Hugging Face Inference API does not batch consistently across models.
  // Simple per-text calls to keep it generic.
  const out: number[][] = [];
  for (const t of texts) {
    const res = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${Bun.env.HF_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(t),
    });
    if (!res.ok) throw new Error(`HF embeddings failed: ${res.status} ${await res.text()}`);
    const arr = (await res.json()) as number[] | number[][];
    const vec = Array.isArray(arr[0]) ? (arr as number[][])[0]! : (arr as number[]);
    out.push(vec);
  }
  return out;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (provider === "openai") return embedOpenAI(texts);
  if (provider === "huggingface") return embedHF(texts);
  throw new Error(`Unsupported EMBEDDING_PROVIDER: ${provider}`);
}

// 4) Upsert to Pinecone via REST host
async function upsertPinecone(vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }>): Promise<void> {
  const host = Bun.env.PINECONE_INDEX_HOST;
  if (!host) throw new Error("PINECONE_INDEX_HOST is required for Pinecone upsert");
  const url = new URL("/vectors/upsert", host).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Api-Key": String(Bun.env.PINECONE_API_KEY ?? "") },
    body: JSON.stringify({ vectors }),
  });
  if (!res.ok) throw new Error(`Pinecone upsert failed: ${res.status} ${await res.text()}`);
}

async function main(): Promise<void> {
  const docs = sampleDocs; // replace with your loader
  const chunks = makeChunks(docs);
  console.log(`Ingesting ${docs.length} docs → ${chunks.length} chunks`);

  // Batch embeddings
  const vectors: Array<{ id: string; values: number[]; metadata?: Record<string, unknown> }> = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embs = await embedBatch(batch.map((b) => b.text));
    for (let j = 0; j < batch.length; j++) {
      vectors.push({ id: batch[j]!.id, values: embs[j]!, metadata: batch[j]!.meta });
    }
    console.log(`Embedded ${i + batch.length}/${chunks.length}`);
  }

  // Upsert vectors
  if ((Bun.env.VECTORDB_TYPE ?? "pinecone").toLowerCase() === "pinecone") {
    // Pinecone upsert in chunks to respect payload limits
    const upsertBatch = Number(Bun.env.UPSERT_BATCH ?? 100);
    for (let i = 0; i < vectors.length; i += upsertBatch) {
      const slice = vectors.slice(i, i + upsertBatch);
      await upsertPinecone(slice);
      console.log(`Upserted ${i + slice.length}/${vectors.length}`);
    }
  } else {
    throw new Error(`Unsupported VECTORDB_TYPE: ${Bun.env.VECTORDB_TYPE}`);
  }

  console.log("Ingestion completed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


