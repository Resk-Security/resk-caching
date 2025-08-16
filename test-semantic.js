#!/usr/bin/env bun

/**
 * Simple test script for semantic caching
 * Run with: bun run test-semantic.js
 */

import { InMemoryVectorCache } from "./src/cache/vector-memory.js";

console.log("🧪 Testing Semantic Cache Functionality...\n");

// Create cache instance
const cache = new InMemoryVectorCache();

// Test 1: Store LLM responses
console.log("1. Storing LLM responses...");
const thankYouEntry = {
  query: "thank you",
  query_embedding: { vector: [0.1, 0.2, 0.3], dimension: 3 },
  responses: [
    { id: "resp1", text: "You're welcome!", metadata: { tone: "friendly" } },
    { id: "resp2", text: "My pleasure!", metadata: { tone: "professional" } },
    { id: "resp3", text: "No problem!", metadata: { tone: "casual" } }
  ],
  variant_strategy: "weighted",
  weights: [3, 2, 1],
  seed: "user:123",
  created_at: new Date(),
  last_accessed: new Date()
};

await cache.storeLLMResponse(thankYouEntry);
console.log("✅ Stored 'thank you' responses");

// Test 2: Store another entry
const helloEntry = {
  query: "hello",
  query_embedding: { vector: [0.9, 0.8, 0.7], dimension: 3 },
  responses: [
    { id: "greet1", text: "Hi there!", metadata: { tone: "friendly" } },
    { id: "greet2", text: "Hello!", metadata: { tone: "formal" } }
  ],
  variant_strategy: "round-robin",
  created_at: new Date(),
  last_accessed: new Date()
};

await cache.storeLLMResponse(helloEntry);
console.log("✅ Stored 'hello' responses");

// Test 3: Search for similar queries
console.log("\n2. Testing semantic search...");
const searchQuery = { vector: [0.12, 0.18, 0.28], dimension: 3 }; // Similar to "thank you"
const results = await cache.searchSimilar("merci", searchQuery, 3, 0.5);

console.log(`Found ${results.matches.length} similar queries:`);
results.matches.forEach((match, index) => {
  console.log(`  ${index + 1}. "${match.entry.query}" (similarity: ${match.similarity_score.toFixed(3)})`);
  console.log(`     Response: "${match.selected_response.text}"`);
  console.log(`     Tone: ${match.selected_response.metadata?.tone || "unknown"}`);
});

// Test 4: Test variant selection
console.log("\n3. Testing variant selection...");
const sameQuery = { vector: [0.1, 0.2, 0.3], dimension: 3 };
const results1 = await cache.searchSimilar("thank you", sameQuery);
const results2 = await cache.searchSimilar("thank you", sameQuery);

console.log(`First search response: "${results1.matches[0].selected_response.text}"`);
console.log(`Second search response: "${results2.matches[0].selected_response.text}"`);

// Test 5: Performance test
console.log("\n4. Performance test...");
const startTime = Date.now();
for (let i = 0; i < 100; i++) {
  const testQuery = { vector: [Math.random(), Math.random(), Math.random()], dimension: 3 };
  await cache.searchSimilar(`test_${i}`, testQuery, 5, 0.1);
}
const endTime = Date.now();

console.log(`✅ 100 searches completed in ${endTime - startTime}ms`);

// Test 6: Get specific responses
console.log("\n5. Getting specific responses...");
const thankYouResponses = await cache.getResponses("thank you");
if (thankYouResponses) {
  console.log(`Found ${thankYouResponses.responses.length} responses for "thank you":`);
  thankYouResponses.responses.forEach((resp, index) => {
    console.log(`  ${index + 1}. ${resp.text} (${resp.metadata?.tone})`);
  });
}

console.log("\n🎉 All tests completed successfully!");
console.log("\n📊 Cache Statistics:");
console.log(`- Total entries: ${cache.entries ? cache.entries.size : 'N/A'}`);
console.log(`- Search time: ${results.search_time_ms}ms`);
console.log(`- Similarity threshold: 0.5`);
console.log(`- Best match score: ${results.matches[0]?.similarity_score.toFixed(3) || 'N/A'}`);
