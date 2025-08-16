import type { VectorSearchBackend, CachedLLMEntry, SemanticSearchResult, VectorEmbedding } from "./types";
import { selectVariant, type VariantSelectionInput } from "../variants/selector";

export class InMemoryVectorCache implements VectorSearchBackend {
  private entries: Map<string, CachedLLMEntry> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  async get(key: string): Promise<unknown | null> {
    const entry = this.entries.get(key);
    if (entry) {
      await this.updateAccessStats(key);
      return entry;
    }
    return null;
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (typeof value === "object" && value !== null && "query" in value) {
      const entry = value as CachedLLMEntry;
      this.entries.set(key, entry);
      this.embeddings.set(key, entry.query_embedding.vector);
      
      // Set TTL if specified
      if (ttlSeconds) {
        setTimeout(() => {
          this.entries.delete(key);
          this.embeddings.delete(key);
        }, ttlSeconds * 1000);
      }
    }
  }

  async clear(): Promise<void> {
    this.entries.clear();
    this.embeddings.clear();
  }

  async storeLLMResponse(entry: CachedLLMEntry): Promise<void> {
    const key = this.buildKey(entry.query);
    this.entries.set(key, entry);
    this.embeddings.set(key, entry.query_embedding.vector);
  }

  async searchSimilar(
    query: string,
    query_embedding: VectorEmbedding,
    limit: number = 5,
    similarity_threshold: number = 0.7
  ): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    const results: Array<{
      entry: CachedLLMEntry;
      similarity_score: number;
      selected_response: any;
    }> = [];

    // Calculate cosine similarity with all stored embeddings
    for (const [key, storedEmbedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(query_embedding.vector, storedEmbedding);
      
      if (similarity >= similarity_threshold) {
        const entry = this.entries.get(key);
        if (entry) {
          // Select a response using variant selection
          const selectedResponse = await this.selectResponse(entry, query);
          
          results.push({
            entry,
            similarity_score: similarity,
            selected_response: selectedResponse
          });
        }
      }
    }

    // Sort by similarity score (highest first) and limit results
    results.sort((a, b) => b.similarity_score - a.similarity_score);
    const limitedResults = results.slice(0, limit);

    return {
      query,
      query_embedding,
      matches: limitedResults,
      total_matches: results.length,
      search_time_ms: Date.now() - startTime
    };
  }

  async getResponses(query: string): Promise<CachedLLMEntry | null> {
    const key = this.buildKey(query);
    return this.entries.get(key) || null;
  }

  async updateAccessStats(query: string): Promise<void> {
    const key = this.buildKey(query);
    const entry = this.entries.get(key);
    if (entry) {
      entry.last_accessed = new Date();
      this.entries.set(key, entry);
    }
  }

  private buildKey(query: string): string {
    return `llm:${query.toLowerCase().trim()}`;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error("Vector dimensions must match");
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      const a = vecA[i]!;
      const b = vecB[i]!;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
  }

  private async selectResponse(entry: CachedLLMEntry, query: string): Promise<any> {
    if (entry.responses.length === 1) {
      return entry.responses[0];
    }

    // Use variant selection if multiple responses exist
    const variantInput: VariantSelectionInput = {
      strategy: entry.variant_strategy || "random",
      variants: entry.responses,
      weights: entry.weights,
      seed: entry.seed || query, // Use query as seed if none provided
    };

    const result = await selectVariant(variantInput);
    return result?.variant || entry.responses[0];
  }
}
