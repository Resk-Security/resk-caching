#!/usr/bin/env bun

/**
 * Simple API test for semantic endpoints
 * Run with: bun run test-api-simple.js
 */

console.log("🧪 Testing Semantic API Endpoints...\n");

// Test the semantic controller directly
import { semanticController } from "./src/web/routes/semantic.js";

// Test 1: Store LLM Response
console.log("1. Testing store endpoint...");
const storeRequest = new Request("http://localhost:3000/api/semantic/store", {
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

try {
  const storeResponse = await semanticController.storeLLMResponse(storeRequest);
  const storeResult = await storeResponse.json();
  
  if (storeResponse.status === 200) {
    console.log("✅ Store endpoint working:", storeResult.message);
  } else {
    console.log("❌ Store endpoint failed:", storeResult.error);
  }
} catch (error) {
  console.log("❌ Store endpoint error:", error.message);
}

// Test 2: Search Similar
console.log("\n2. Testing search endpoint...");
const searchRequest = new Request("http://localhost:3000/api/semantic/search", {
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

try {
  const searchResponse = await semanticController.searchSimilar(searchRequest);
  const searchResult = await searchResponse.json();
  
  if (searchResponse.status === 200) {
    console.log("✅ Search endpoint working:", searchResult.search_result.total_matches, "matches found");
  } else {
    console.log("❌ Search endpoint failed:", searchResult.error);
  }
} catch (error) {
  console.log("❌ Search endpoint error:", error.message);
}

// Test 3: Get Responses
console.log("\n3. Testing get responses endpoint...");
const getRequest = new Request("http://localhost:3000/api/semantic/responses?query=test query");

try {
  const getResponse = await semanticController.getResponses(getRequest);
  const getResult = await getResponse.json();
  
  if (getResponse.status === 200) {
    console.log("✅ Get responses endpoint working:", getResult.entry.responses.length, "responses found");
  } else if (getResponse.status === 404) {
    console.log("ℹ️ Get responses endpoint working (no responses found for query)");
  } else {
    console.log("❌ Get responses endpoint failed:", getResult.error);
  }
} catch (error) {
  console.log("❌ Get responses endpoint error:", error.message);
}

// Test 4: Get Stats
console.log("\n4. Testing stats endpoint...");
const statsRequest = new Request("http://localhost:3000/api/semantic/stats");

try {
  const statsResponse = await semanticController.getStats(statsRequest);
  const statsResult = await statsResponse.json();
  
  if (statsResponse.status === 200) {
    console.log("✅ Stats endpoint working:", statsResult.cache_type);
  } else {
    console.log("❌ Stats endpoint failed:", statsResult.error);
  }
} catch (error) {
  console.log("❌ Stats endpoint error:", error.message);
}

console.log("\n🎉 API testing completed!");
