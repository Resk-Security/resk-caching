import { z } from "zod";
import type { CachedLLMEntry, VectorEmbedding, LLMResponse } from "../../cache/types";
import { InMemoryVectorCache } from "../../cache/vector-memory";

// Initialize vector cache
const vectorCache = new InMemoryVectorCache();

// Schema for storing LLM responses
const storeLLMSchema = z.object({
  query: z.string().min(1).max(10000),
  query_embedding: z.object({
    vector: z.array(z.number()),
    dimension: z.number().positive()
  }),
  responses: z.array(z.object({
    id: z.string(),
    text: z.string(),
    metadata: z.record(z.unknown()).optional(),
    quality_score: z.number().min(0).max(1).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional()
  })).min(1),
  variant_strategy: z.enum(["random", "round-robin", "deterministic", "weighted"]).optional(),
  weights: z.array(z.number().positive()).optional(),
  seed: z.union([z.string(), z.number()]).optional(),
  ttl: z.number().int().positive().optional()
});

// Schema for semantic search
const searchSchema = z.object({
  query: z.string().min(1).max(10000),
  query_embedding: z.object({
    vector: z.array(z.number()),
    dimension: z.number().positive()
  }),
  limit: z.number().int().positive().max(20).optional(),
  similarity_threshold: z.number().min(0).max(1).optional()
});

export const semanticController = {
  /**
   * Store LLM responses with vector embeddings for future semantic search
   */
  async storeLLMResponse(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const parsed = storeLLMSchema.safeParse(body);
      
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ 
            error: "Bad Request", 
            details: parsed.error.flatten() 
          }), 
          { 
            status: 400, 
            headers: { "content-type": "application/json" } 
          }
        );
      }

      const entry: CachedLLMEntry = {
        ...parsed.data,
        created_at: new Date(),
        last_accessed: new Date()
      };

      await vectorCache.storeLLMResponse(entry);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "LLM responses stored successfully",
          entry_id: entry.query,
          responses_count: entry.responses.length
        }), 
        { 
          headers: { "content-type": "application/json" } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Internal Server Error", 
          message: error instanceof Error ? error.message : "Unknown error" 
        }), 
        { 
          status: 500, 
          headers: { "content-type": "application/json" } 
        }
      );
    }
  },

  /**
   * Search for semantically similar LLM responses
   */
  async searchSimilar(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const parsed = searchSchema.safeParse(body);
      
      if (!parsed.success) {
        return new Response(
          JSON.stringify({ 
            error: "Bad Request", 
            details: parsed.error.flatten() 
          }), 
          { 
            status: 400, 
            headers: { "content-type": "application/json" } 
          }
        );
      }

      const { query, query_embedding, limit, similarity_threshold } = parsed.data;
      
      const searchResult = await vectorCache.searchSimilar(
        query,
        query_embedding,
        limit,
        similarity_threshold
      );

      // Update access stats for the matched entries
      for (const match of searchResult.matches) {
        await vectorCache.updateAccessStats(match.entry.query);
      }

      return new Response(
        JSON.stringify({
          success: true,
          search_result: searchResult
        }), 
        { 
          headers: { "content-type": "application/json" } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Internal Server Error", 
          message: error instanceof Error ? error.message : "Unknown error" 
        }), 
        { 
          status: 500, 
          headers: { "content-type": "application/json" } 
        }
      );
    }
  },

  /**
   * Get all responses for a specific query
   */
  async getResponses(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("query");
      
      if (!query) {
        return new Response(
          JSON.stringify({ 
            error: "Bad Request", 
            message: "Query parameter is required" 
          }), 
          { 
            status: 400, 
            headers: { "content-type": "application/json" } 
          }
        );
      }

      const entry = await vectorCache.getResponses(query);
      
      if (!entry) {
        return new Response(
          JSON.stringify({ 
            error: "Not Found", 
            message: "No responses found for this query" 
          }), 
          { 
            status: 404, 
            headers: { "content-type": "application/json" } 
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          entry
        }), 
        { 
          headers: { "content-type": "application/json" } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Internal Server Error", 
          message: error instanceof Error ? error.message : "Unknown error" 
        }), 
        { 
          status: 500, 
          headers: { "content-type": "application/json" } 
        }
      );
    }
  },

  /**
   * Get cache statistics
   */
  async getStats(): Promise<Response> {
    try {
      // This would need to be implemented in the vector cache
      // For now, return basic info
      return new Response(
        JSON.stringify({
          success: true,
          cache_type: "InMemoryVectorCache",
          message: "Stats endpoint - implementation needed"
        }), 
        { 
          headers: { "content-type": "application/json" } 
        }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: "Internal Server Error", 
          message: error instanceof Error ? error.message : "Unknown error" 
        }), 
        { 
          status: 500, 
          headers: { "content-type": "application/json" } 
        }
      );
    }
  }
};
