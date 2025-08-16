import { describe, it, expect, beforeEach } from "bun:test";
import { InMemoryVectorCache } from "../src/cache/vector-memory";
import type { CachedLLMEntry, VectorEmbedding, LLMResponse } from "../src/cache/types";

describe("Semantic Cache Tests", () => {
  let cache: InMemoryVectorCache;

  beforeEach(() => {
    cache = new InMemoryVectorCache();
  });

  describe("Basic Operations", () => {
    it("should store and retrieve LLM responses", async () => {
      const entry: CachedLLMEntry = {
        query: "thank you",
        query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
        responses: [
          { id: "resp1", text: "You're welcome!", metadata: { tone: "friendly" } }
        ],
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);
      const retrieved = await cache.getResponses("thank you");
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.query).toBe("thank you");
      expect(retrieved?.responses).toHaveLength(1);
    });

    it("should clear all entries", async () => {
      const entry: CachedLLMEntry = {
        query: "hello",
        query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
        responses: [{ id: "resp1", text: "Hi!", metadata: {} }],
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);
      await cache.clear();
      
      const retrieved = await cache.getResponses("hello");
      expect(retrieved).toBeNull();
    });
  });

  describe("Vector Similarity Search", () => {
    it("should find similar queries using cosine similarity", async () => {
      // Store multiple entries
      const entries: CachedLLMEntry[] = [
        {
          query: "thank you",
          query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
          responses: [{ id: "resp1", text: "You're welcome!", metadata: {} }],
          created_at: new Date(),
          last_accessed: new Date()
        },
        {
          query: "thanks",
          query_embedding: { vector: [0.12, 0.18, 0.28], dimension: 3 },
          responses: [{ id: "resp2", text: "My pleasure!", metadata: {} }],
          created_at: new Date(),
          last_accessed: new Date()
        },
        {
          query: "hello",
          query_embedding: { vector: [0.9, 0.8, 0.7], dimension: 3 },
          responses: [{ id: "resp3", text: "Hi there!", metadata: {} }],
          created_at: new Date(),
          last_accessed: new Date()
        }
      ];

      for (const entry of entries) {
        await cache.storeLLMResponse(entry);
      }

      // Search for similar query
      const searchQuery: VectorEmbedding = { vector: [0.11, 0.19, 0.29], dimension: 3 };
      const results = await cache.searchSimilar("merci", searchQuery, 2, 0.5);

      expect(results.matches).toHaveLength(2);
      expect(results.total_matches).toBe(2);
      
      // Should find "thank you" and "thanks" as most similar
      const firstMatch = results.matches[0];
      expect(firstMatch.similarity_score).toBeGreaterThan(0.8);
      expect(firstMatch.entry.query).toMatch(/thank/);
    });

    it("should respect similarity threshold", async () => {
      const entry: CachedLLMEntry = {
        query: "thank you",
        query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
        responses: [{ id: "resp1", text: "You're welcome!", metadata: {} }],
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);

      // Search with very high threshold
      const searchQuery: VectorEmbedding = { vector: [0.9, 0.8, 0.7], dimension: 3 };
      const results = await cache.searchSimilar("different", searchQuery, 5, 0.95);

      expect(results.matches).toHaveLength(0);
      expect(results.total_matches).toBe(0);
    });
  });

  describe("Response Selection with Variants", () => {
    it("should select single response when only one exists", async () => {
      const entry: CachedLLMEntry = {
        query: "hello",
        query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
        responses: [{ id: "resp1", text: "Hi!", metadata: {} }],
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);
      const searchQuery: VectorEmbedding = { vector: [0.1, 0.2, 0.3], dimension: 3 };
      const results = await cache.searchSimilar("hello", searchQuery);

      expect(results.matches[0].selected_response.text).toBe("Hi!");
    });

    it("should use weighted selection strategy", async () => {
      const entry: CachedLLMEntry = {
        query: "thank you",
        query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
        responses: [
          { id: "resp1", text: "You're welcome!", metadata: {} },
          { id: "resp2", text: "My pleasure!", metadata: {} },
          { id: "resp3", text: "No problem!", metadata: {} }
        ],
        variant_strategy: "weighted",
        weights: [3, 2, 1], // First response has highest weight
        seed: "user:123",
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);
      const searchQuery: VectorEmbedding = { vector: [0.1, 0.2, 0.3], dimension: 3 };
      
      // Test multiple searches to see if weighted selection works
      const results1 = await cache.searchSimilar("thank you", searchQuery);
      const results2 = await cache.searchSimilar("thank you", searchQuery);
      
      expect(results1.matches[0].selected_response).toBeDefined();
      expect(results2.matches[0].selected_response).toBeDefined();
    });

    it("should use deterministic selection with seed", async () => {
      const entry: CachedLLMEntry = {
        query: "hello",
        query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
        responses: [
          { id: "resp1", text: "Hi!", metadata: {} },
          { id: "resp2", text: "Hello!", metadata: {} },
          { id: "resp3", text: "Hey!", metadata: {} }
        ],
        variant_strategy: "deterministic",
        seed: "user:456",
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);
      const searchQuery: VectorEmbedding = { vector: [0.1, 0.2, 0.3], dimension: 3 };
      
      // Same seed should always return same response
      const results1 = await cache.searchSimilar("hello", searchQuery);
      const results2 = await cache.searchSimilar("hello", searchQuery);
      
      expect(results1.matches[0].selected_response.id).toBe(results2.matches[0].selected_response.id);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty responses array", async () => {
      const entry: CachedLLMEntry = {
        query: "empty",
        query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
        responses: [],
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);
      const searchQuery: VectorEmbedding = { vector: [0.1, 0.2, 0.3], dimension: 3 };
      const results = await cache.searchSimilar("empty", searchQuery);

      expect(results.matches).toHaveLength(0);
    });

    it("should handle different vector dimensions", async () => {
      const entry: CachedLLMEntry = {
        query: "test",
        query_embedding: { vector: [0.1, 0.2], dimension: 2 },
        responses: [{ id: "resp1", text: "Test response", metadata: {} }],
        created_at: new Date(),
        last_accessed: new Date()
      };

      await cache.storeLLMResponse(entry);
      
      // Search with different dimension should throw error
      const searchQuery: VectorEmbedding = { vector: [0.1, 0.2, 0.3], dimension: 3 };
      
      expect(async () => {
        await cache.searchSimilar("test", searchQuery);
      }).toThrow("Vector dimensions must match");
    });
  });

  describe("Performance", () => {
    it("should measure search time", async () => {
      // Store multiple entries
      for (let i = 0; i < 10; i++) {
        const entry: CachedLLMEntry = {
          query: `query_${i}`,
          query_embedding: { vector: [i * 0.1, i * 0.2, i * 0.3], dimension: 3 },
          responses: [{ id: `resp_${i}`, text: `Response ${i}`, metadata: {} }],
          created_at: new Date(),
          last_accessed: new Date()
        };
        await cache.storeLLMResponse(entry);
      }

      const searchQuery: VectorEmbedding = { vector: [0.5, 0.6, 0.7], dimension: 3 };
      const results = await cache.searchSimilar("performance_test", searchQuery);

      expect(results.search_time_ms).toBeGreaterThan(0);
      expect(results.search_time_ms).toBeLessThan(100); // Should be very fast for in-memory
    });
  });
});
