export interface CacheBackend {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  clear(): Promise<void>;
}

// New types for vector-based semantic search
export interface VectorEmbedding {
  vector: number[];
  dimension: number;
}

export interface LLMResponse {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
  quality_score?: number;
  category?: string;
  tags?: string[];
  [key: string]: unknown; // Add index signature for VariantItem compatibility
}

export interface CachedLLMEntry {
  query: string;
  query_embedding: VectorEmbedding;
  responses: LLMResponse[];
  variant_strategy?: "random" | "round-robin" | "deterministic" | "weighted";
  weights?: number[];
  seed?: string | number;
  ttl?: number;
  created_at: Date;
  last_accessed?: Date;
}

export interface SemanticSearchResult {
  query: string;
  query_embedding: VectorEmbedding;
  matches: Array<{
    entry: CachedLLMEntry;
    similarity_score: number;
    selected_response: LLMResponse;
  }>;
  total_matches: number;
  search_time_ms: number;
}

export interface VectorSearchBackend extends CacheBackend {
  // Store LLM responses with vector embeddings
  storeLLMResponse(entry: CachedLLMEntry): Promise<void>;
  
  // Search for similar queries using vector similarity
  searchSimilar(
    query: string, 
    query_embedding: VectorEmbedding, 
    limit?: number,
    similarity_threshold?: number
  ): Promise<SemanticSearchResult>;
  
  // Get all responses for a specific query
  getResponses(query: string): Promise<CachedLLMEntry | null>;
  
  // Update access statistics
  updateAccessStats(query: string): Promise<void>;
}


