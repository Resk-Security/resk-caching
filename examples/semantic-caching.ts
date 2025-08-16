#!/usr/bin/env bun

/**
 * Comprehensive Example: Semantic Caching for LLM Responses
 * 
 * This example demonstrates:
 * - Storing LLM responses with vector embeddings
 * - Semantic similarity search
 * - Response selection with variant strategies
 * - Performance monitoring and metrics
 */

import type { CachedLLMEntry, VectorEmbedding } from "../src/cache/types";
import { InMemoryVectorCache } from "../src/cache/vector-memory";

// Initialize the vector cache
const cache = new InMemoryVectorCache();

async function demonstrateSemanticCaching() {
  console.log("🚀 Starting Semantic Caching Demonstration...\n");

  try {
    // 1. Store various LLM responses with different strategies
    await storeThankYouResponses();
    await storeGreetingResponses();
    await storeQuestionResponses();

    // 2. Demonstrate semantic search capabilities
    await searchSimilarQueries();
    
    // 3. Show variant selection in action
    await demonstrateVariantSelection();
    
    // 4. Performance testing
    await performanceTest();
    
    // 5. Cache statistics
    await showCacheStats();

    console.log("🎉 All demonstrations completed successfully!");
    
  } catch (error) {
    console.error("❌ Error during demonstration:", error);
  }
}

async function storeThankYouResponses() {
  console.log("1️⃣ Storing 'thank you' responses with weighted strategy...");
  
  const entry: CachedLLMEntry = {
    query: "thank you",
    query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
    responses: [
      {
        id: "thank_1",
        text: "You're welcome! I'm glad I could help.",
        metadata: { tone: "friendly", formality: "casual", language: "en" },
        quality_score: 0.95,
        category: "gratitude",
        tags: ["polite", "casual", "helpful"]
      },
      {
        id: "thank_2",
        text: "My pleasure! Feel free to ask if you need anything else.",
        metadata: { tone: "professional", formality: "formal", language: "en" },
        quality_score: 0.92,
        category: "gratitude",
        tags: ["polite", "professional", "helpful"]
      },
      {
        id: "thank_3",
        text: "No problem at all! Happy to help.",
        metadata: { tone: "casual", formality: "informal", language: "en" },
        quality_score: 0.88,
        category: "gratitude",
        tags: ["casual", "friendly", "helpful"]
      }
    ],
    variant_strategy: "weighted",
    weights: [3, 2, 1], // First response has highest weight
    seed: "user:123",
    created_at: new Date(),
    last_accessed: new Date()
  };

  await cache.storeLLMResponse(entry);
  console.log("✅ Stored 'thank you' responses with weighted strategy");
}

async function storeGreetingResponses() {
  console.log("2️⃣ Storing greeting responses with round-robin strategy...");
  
  const entry: CachedLLMEntry = {
    query: "hello",
    query_embedding: { vector: [0.9, 0.8, 0.7], dimension: 3 },
    responses: [
      {
        id: "hello_1",
        text: "Hi there! How can I help you today?",
        metadata: { tone: "friendly", time_of_day: "any", language: "en" },
        quality_score: 0.93,
        category: "greeting",
        tags: ["friendly", "helpful", "versatile"]
      },
      {
        id: "hello_2",
        text: "Hello! I hope you're having a great day.",
        metadata: { tone: "polite", time_of_day: "morning", language: "en" },
        quality_score: 0.89,
        category: "greeting",
        tags: ["polite", "morning", "positive"]
      },
      {
        id: "hello_3",
        text: "Hey! What's on your mind?",
        metadata: { tone: "casual", time_of_day: "any", language: "en" },
        quality_score: 0.87,
        category: "greeting",
        tags: ["casual", "conversational", "engaging"]
      }
    ],
    variant_strategy: "round-robin",
    seed: "user:456",
    created_at: new Date(),
    last_accessed: new Date()
  };

  await cache.storeLLMResponse(entry);
  console.log("✅ Stored greeting responses with round-robin strategy");
}

async function storeQuestionResponses() {
  console.log("3️⃣ Storing question responses with deterministic strategy...");
  
  const entry: CachedLLMEntry = {
    query: "how are you",
    query_embedding: { vector: [0.3, 0.4, 0.5], dimension: 3 },
    responses: [
      {
        id: "how_1",
        text: "I'm doing well, thank you for asking! How about you?",
        metadata: { tone: "friendly", formality: "casual", language: "en" },
        quality_score: 0.94,
        category: "conversation",
        tags: ["friendly", "reciprocal", "engaging"]
      },
      {
        id: "how_2",
        text: "I'm functioning perfectly and ready to assist you.",
        metadata: { tone: "professional", formality: "formal", language: "en" },
        quality_score: 0.91,
        category: "conversation",
        tags: ["professional", "efficient", "helpful"]
      }
    ],
    variant_strategy: "deterministic",
    seed: "user:789",
    created_at: new Date(),
    last_accessed: new Date()
  };

  await cache.storeLLMResponse(entry);
  console.log("✅ Stored question responses with deterministic strategy");
}

async function searchSimilarQueries() {
  console.log("\n🔍 Demonstrating semantic search capabilities...");
  
  // Search for French "thank you" - should find English "thank you"
  const searchQuery: VectorEmbedding = { vector: [0.11, 0.19, 0.29], dimension: 3 };
  console.log("   Searching for 'merci' (French thank you)...");
  
  const results = await cache.searchSimilar("merci", searchQuery, 2, 0.8);
  
  console.log(`   Found ${results.matches.length} similar queries:`);
  results.matches.forEach((match, index) => {
    console.log(`   ${index + 1}. "${match.entry.query}" (similarity: ${match.similarity_score.toFixed(3)})`);
    console.log(`      Response: "${match.selected_response.text}"`);
    console.log(`      Tone: ${match.selected_response.metadata?.tone || 'unknown'}`);
  });
}

async function demonstrateVariantSelection() {
  console.log("\n🎲 Demonstrating variant selection strategies...");
  
  // Test weighted selection multiple times
  const searchQuery: VectorEmbedding = { vector: [0.1, 0.2, 0.3], dimension: 3 };
  
  console.log("   Testing weighted selection for 'thank you' (3 times):");
  for (let i = 1; i <= 3; i++) {
    const results = await cache.searchSimilar("thank you", searchQuery);
    const response = results.matches[0]?.selected_response;
    console.log(`   ${i}. "${response?.text}" (ID: ${response?.id})`);
  }
  
  // Test deterministic selection
  console.log("   Testing deterministic selection for 'how are you':");
  const questionQuery: VectorEmbedding = { vector: [0.3, 0.4, 0.5], dimension: 3 };
  const results1 = await cache.searchSimilar("how are you", questionQuery);
  const results2 = await cache.searchSimilar("how are you", questionQuery);
  
  const response1 = results1.matches[0]?.selected_response;
  const response2 = results2.matches[0]?.selected_response;
  
  console.log(`   1st: "${response1?.text}" (ID: ${response1?.id})`);
  console.log(`   2nd: "${response2?.text}" (ID: ${response2?.id})`);
  console.log(`   Deterministic: ${response1?.id === response2?.id ? '✅' : '❌'}`);
}

async function performanceTest() {
  console.log("\n⚡ Performance testing...");
  
  // Store many entries for performance test
  const startTime = Date.now();
  const entryCount = 100;
  
  for (let i = 0; i < entryCount; i++) {
    const entry: CachedLLMEntry = {
      query: `performance_test_${i}`,
      query_embedding: { 
        vector: [i * 0.01, i * 0.02, i * 0.03], 
        dimension: 3 
      },
      responses: [{
        id: `resp_${i}`,
        text: `Response ${i}`,
        metadata: { test: true, index: i }
      }],
      created_at: new Date(),
      last_accessed: new Date()
    };
    await cache.storeLLMResponse(entry);
  }
  
  const storeTime = Date.now() - startTime;
  console.log(`   Stored ${entryCount} entries in ${storeTime}ms`);
  
  // Test search performance
  const searchStart = Date.now();
  const searchQuery: VectorEmbedding = { vector: [0.5, 0.6, 0.7], dimension: 3 };
  const searchResults = await cache.searchSimilar("performance_search", searchQuery, 10);
  const searchTime = Date.now() - searchStart;
  
  console.log(`   Searched ${entryCount} entries in ${searchTime}ms`);
  console.log(`   Found ${searchResults.matches.length} matches`);
  console.log(`   Average search time: ${(searchTime / 1).toFixed(2)}ms per search`);
}

async function showCacheStats() {
  console.log("\n📊 Cache Statistics:");
  
  // Get some basic stats
  const thankYouEntry = await cache.getResponses("thank you");
  const helloEntry = await cache.getResponses("hello");
  const howAreYouEntry = await cache.getResponses("how are you");
  
  console.log(`   Total unique queries: 3`);
  console.log(`   'thank you' responses: ${thankYouEntry?.responses.length || 0}`);
  console.log(`   'hello' responses: ${helloEntry?.responses.length || 0}`);
  console.log(`   'how are you' responses: ${howAreYouEntry?.responses.length || 0}`);
  
  // Show variant strategies
  console.log(`   Variant strategies:`);
  console.log(`     - thank you: ${thankYouEntry?.variant_strategy || 'none'} (weighted)`);
  console.log(`     - hello: ${helloEntry?.variant_strategy || 'none'} (round-robin)`);
  console.log(`     - how are you: ${howAreYouEntry?.variant_strategy || 'none'} (deterministic)`);
}

// Run the demonstration
if (import.meta.main) {
  demonstrateSemanticCaching();
}

export { demonstrateSemanticCaching };
