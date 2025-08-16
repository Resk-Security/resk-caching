/**
 * Example: Semantic Caching for LLM Responses
 * 
 * This example demonstrates how to:
 * 1. Store LLM responses with vector embeddings
 * 2. Search for similar queries using semantic similarity
 * 3. Use variant selection algorithms to choose different responses
 */

import type { CachedLLMEntry, VectorEmbedding, LLMResponse } from "../src/cache/types";

// Example: Store multiple "thank you" responses for different contexts
async function storeThankYouResponses() {
  const baseUrl = "http://localhost:3000/api/semantic";
  
  // Create vector embeddings for "thank you" queries
  // In real usage, these would come from an embedding model like OpenAI, Cohere, etc.
  const thankYouEmbedding: VectorEmbedding = {
    vector: [0.1, 0.2, 0.3, 0.4, 0.5], // Simplified example
    dimension: 5
  };

  const responses: LLMResponse[] = [
    {
      id: "thank_1",
      text: "You're welcome! I'm glad I could help.",
      metadata: { tone: "friendly", formality: "casual" },
      quality_score: 0.9,
      category: "gratitude",
      tags: ["positive", "helpful"]
    },
    {
      id: "thank_2", 
      text: "My pleasure! Feel free to ask if you need anything else.",
      metadata: { tone: "professional", formality: "formal" },
      quality_score: 0.85,
      category: "gratitude",
      tags: ["professional", "helpful"]
    },
    {
      id: "thank_3",
      text: "No problem at all! Happy to assist.",
      metadata: { tone: "casual", formality: "informal" },
      quality_score: 0.8,
      category: "gratitude", 
      tags: ["casual", "friendly"]
    },
    {
      id: "thank_4",
      text: "Anytime! That's what I'm here for.",
      metadata: { tone: "enthusiastic", formality: "casual" },
      quality_score: 0.75,
      category: "gratitude",
      tags: ["enthusiastic", "casual"]
    }
  ];

  const entry: CachedLLMEntry = {
    query: "thank you",
    query_embedding: thankYouEmbedding,
    responses,
    variant_strategy: "weighted", // Use weighted selection
    weights: [3, 2, 2, 1], // Higher weight for first response
    seed: "user:123", // Deterministic for this user
    ttl: 86400 // 24 hours
  };

  try {
    const response = await fetch(`${baseUrl}/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-jwt-token"
      },
      body: JSON.stringify(entry)
    });

    const result = await response.json();
    console.log("Stored thank you responses:", result);
  } catch (error) {
    console.error("Error storing responses:", error);
  }
}

// Example: Search for similar queries and get varied responses
async function searchSimilarQueries() {
  const baseUrl = "http://localhost:3000/api/semantic";
  
  // User sends a "thank you" message
  const userQuery = "merci pour ta réponse";
  const userEmbedding: VectorEmbedding = {
    vector: [0.12, 0.18, 0.28, 0.42, 0.48], // Similar to thank you
    dimension: 5
  };

  try {
    const response = await fetch(`${baseUrl}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-jwt-token"
      },
      body: JSON.stringify({
        query: userQuery,
        query_embedding: userEmbedding,
        limit: 3,
        similarity_threshold: 0.6
      })
    });

    const result = await response.json();
    console.log("Search results:", result);

    if (result.success && result.search_result.matches.length > 0) {
      const bestMatch = result.search_result.matches[0];
      console.log("Best match similarity:", bestMatch.similarity_score);
      console.log("Selected response:", bestMatch.selected_response.text);
      console.log("Response metadata:", bestMatch.selected_response.metadata);
    }
  } catch (error) {
    console.error("Error searching:", error);
  }
}

// Example: Store responses for different query types
async function storeMultipleQueryTypes() {
  const baseUrl = "http://localhost:3000/api/semantic";
  
  // 1. Greetings
  const greetingResponses: LLMResponse[] = [
    { id: "greet_1", text: "Hello! How can I help you today?", metadata: { tone: "friendly" } },
    { id: "greet_2", text: "Hi there! What can I assist you with?", metadata: { tone: "casual" } },
    { id: "greet_3", text: "Good day! How may I be of service?", metadata: { tone: "formal" } }
  ];

  const greetingEntry: CachedLLMEntry = {
    query: "hello",
    query_embedding: { vector: [0.2, 0.3, 0.4, 0.5, 0.6], dimension: 5 },
    responses: greetingResponses,
    variant_strategy: "round-robin", // Cycle through responses
    ttl: 86400
  };

  // 2. Goodbyes
  const goodbyeResponses: LLMResponse[] = [
    { id: "bye_1", text: "Goodbye! Have a great day!", metadata: { tone: "positive" } },
    { id: "bye_2", text: "See you later! Take care!", metadata: { tone: "casual" } },
    { id: "bye_3", text: "Farewell! Until next time.", metadata: { tone: "formal" } }
  ];

  const goodbyeEntry: CachedLLMEntry = {
    query: "goodbye",
    query_embedding: { vector: [0.7, 0.8, 0.9, 1.0, 1.1], dimension: 5 },
    responses: goodbyeResponses,
    variant_strategy: "random", // Random selection
    ttl: 86400
  };

  try {
    // Store both entry types
    await fetch(`${baseUrl}/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-jwt-token"
      },
      body: JSON.stringify(greetingEntry)
    });

    await fetch(`${baseUrl}/store`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer your-jwt-token"
      },
      body: JSON.stringify(goodbyeEntry)
    });

    console.log("Stored multiple query types successfully");
  } catch (error) {
    console.error("Error storing multiple types:", error);
  }
}

// Example: Get all responses for a specific query
async function getQueryResponses() {
  const baseUrl = "http://localhost:3000/api/semantic";
  
  try {
    const response = await fetch(`${baseUrl}/responses?query=thank you`, {
      headers: {
        "Authorization": "Bearer your-jwt-token"
      }
    });

    const result = await response.json();
    if (result.success) {
      console.log("All responses for 'thank you':", result.entry.responses);
      console.log("Variant strategy:", result.entry.variant_strategy);
      console.log("Weights:", result.entry.weights);
    }
  } catch (error) {
    console.error("Error getting responses:", error);
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting Semantic Caching Examples...\n");

  console.log("1. Storing thank you responses...");
  await storeThankYouResponses();

  console.log("\n2. Storing multiple query types...");
  await storeMultipleQueryTypes();

  console.log("\n3. Searching for similar queries...");
  await searchSimilarQueries();

  console.log("\n4. Getting all responses for a query...");
  await getQueryResponses();

  console.log("\n✅ Examples completed!");
}

// Run examples if this file is executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export { storeThankYouResponses, searchSimilarQueries, storeMultipleQueryTypes, getQueryResponses };
