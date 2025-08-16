import { describe, it, expect } from "bun:test";

import { semanticController } from "../src/web/routes/semantic";

describe("Semantic API Integration Tests", () => {
  describe("Store LLM Response", () => {
    it("should store LLM responses successfully", async () => {
      const request = new Request("http://localhost:3000/api/semantic/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "test query",
          query_embedding: {
            vector: [0.1, 0.2, 0.3],
            dimension: 3
          },
          responses: [
            {
              id: "resp1",
              text: "Test response 1",
              metadata: { tone: "friendly" },
              quality_score: 0.9,
              category: "test"
            }
          ],
          variant_strategy: "random"
        })
      });

      const response = await semanticController.storeLLMResponse(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.message).toBe("LLM responses stored successfully");
      expect(result.responses_count).toBe(1);
    });

    it("should validate required fields", async () => {
      const request = new Request("http://localhost:3000/api/semantic/store", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "", // Empty query should fail
          responses: [] // Empty responses should fail
        })
      });

      const response = await semanticController.storeLLMResponse(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Bad Request");
    });
  });

  describe("Search Similar", () => {
    it("should find similar queries", async () => {
      const request = new Request("http://localhost:3000/api/semantic/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "search query",
          query_embedding: {
            vector: [0.1, 0.2, 0.3],
            dimension: 3
          },
          limit: 5,
          similarity_threshold: 0.5
        })
      });

      const response = await semanticController.searchSimilar(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.search_result).toBeDefined();
      expect(result.search_result.query).toBe("search query");
    });

    it("should handle invalid search parameters", async () => {
      const request = new Request("http://localhost:3000/api/semantic/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "", // Empty query should fail
          query_embedding: {
            vector: [0.1, 0.2], // Wrong dimension
            dimension: 3
          }
        })
      });

      const response = await semanticController.searchSimilar(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Bad Request");
    });
  });

  describe("Get Responses", () => {
    it("should retrieve responses for a query", async () => {
      const request = new Request("http://localhost:3000/api/semantic/responses?query=test");
      
            const response = await semanticController.getResponses(request);
      
      // Should either find responses or return 404
      expect([200, 404]).toContain(response.status);
    });

    it("should require query parameter", async () => {
      const request = new Request("http://localhost:3000/api/semantic/responses");
      
      const response = await semanticController.getResponses(request);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe("Bad Request");
      expect(result.message).toBe("Query parameter is required");
    });
  });

  describe("Get Stats", () => {
    it("should return cache statistics", async () => {
      const request = new Request("http://localhost:3000/api/semantic/stats");
      
      const response = await semanticController.getStats(request);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result.success).toBe(true);
      expect(result.cache_type).toBe("InMemoryVectorCache");
    });
  });
});
