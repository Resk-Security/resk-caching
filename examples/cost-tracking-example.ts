/**
 * Cost Tracking and ROI Analysis Example
 * 
 * This example demonstrates how to use the CostTracker to monitor
 * LLM API costs and calculate savings from caching.
 */

import { CostTracker, globalCostTracker } from "../src/cost/cost-tracker";

async function runCostTrackingExample() {
  console.log("🔍 Cost Tracking and ROI Analysis Example");
  console.log("==========================================");

  // Initialize a custom cost tracker with specific pricing
  const tracker = new CostTracker([
    {
      provider: "openai",
      model: "gpt-4-turbo",
      costPerThousandTokens: { input: 0.01, output: 0.03 }
    },
    {
      provider: "anthropic",
      model: "claude-3-haiku",
      costPerThousandTokens: { input: 0.00025, output: 0.00125 }
    }
  ]);

  console.log("\n📊 Step 1: Recording API costs");

  // Simulate recording costs for various API calls
  const scenarios = [
    { provider: "openai", model: "gpt-4", inputTokens: 150, outputTokens: 300, cacheHit: false },
    { provider: "openai", model: "gpt-4", inputTokens: 140, outputTokens: 250, cacheHit: true },
    { provider: "openai", model: "gpt-3.5-turbo", inputTokens: 200, outputTokens: 400, cacheHit: false },
    { provider: "openai", model: "gpt-3.5-turbo", inputTokens: 190, outputTokens: 380, cacheHit: true },
    { provider: "anthropic", model: "claude-3-opus", inputTokens: 300, outputTokens: 500, cacheHit: false },
    { provider: "anthropic", model: "claude-3-opus", inputTokens: 280, outputTokens: 450, cacheHit: true },
  ];

  scenarios.forEach((scenario, index) => {
    const cost = tracker.recordCost(scenario);
    console.log(`  ${index + 1}. ${scenario.provider}/${scenario.model}: $${cost.cost.toFixed(4)} ${scenario.cacheHit ? '(CACHED 💰)' : '(API CALL 💸)'}`);
  });

  console.log("\n📈 Step 2: Cost Analysis and ROI");

  // Get comprehensive cost analysis
  const analysis = tracker.getCostAnalysis(7); // 7 days
  console.log(`\n🎯 Cost Analysis (Last 7 days):`);
  console.log(`   Total Requests: ${analysis.totalRequests}`);
  console.log(`   Cache Hit Rate: ${analysis.cacheHitRate.toFixed(1)}%`);
  console.log(`   Total Cost: $${analysis.totalCost.toFixed(4)}`);
  console.log(`   Total Savings: $${analysis.totalSavings.toFixed(4)}`);
  console.log(`   ROI Percentage: ${analysis.roiPercentage.toFixed(1)}%`);
  console.log(`   Avg Cost/Request: $${analysis.avgCostPerRequest.toFixed(4)}`);
  console.log(`   Avg Savings/Request: $${analysis.avgSavingsPerRequest.toFixed(4)}`);

  console.log("\n🔍 Step 3: Cost Breakdown by Provider");

  // Get detailed breakdown by provider and model
  const breakdown = tracker.getCostBreakdown(7);
  console.log(`\n📋 Provider Breakdown:`);
  breakdown.forEach(item => {
    console.log(`   ${item.provider}/${item.model}:`);
    console.log(`     Requests: ${item.requestCount}`);
    console.log(`     Hit Rate: ${item.hitRate.toFixed(1)}%`);
    console.log(`     Total Cost: $${item.totalCost.toFixed(4)}`);
    console.log(`     Savings: $${item.totalSavings.toFixed(4)}`);
    console.log("");
  });

  console.log("\n💡 Step 4: ROI Projection");

  // Calculate projected savings with different cache hit rates
  const currentCostPerRequest = analysis.avgCostPerRequest;
  const projections = [50, 70, 85, 95];

  console.log(`\n📊 ROI Projections (based on current usage):`);
  projections.forEach(hitRate => {
    const savingsPerRequest = currentCostPerRequest * (hitRate / 100);
    const monthlySavings = savingsPerRequest * analysis.totalRequests * 30;
    const roi = (savingsPerRequest / currentCostPerRequest) * 100;
    
    console.log(`   ${hitRate}% Hit Rate:`);
    console.log(`     Monthly Savings: $${monthlySavings.toFixed(2)}`);
    console.log(`     ROI: ${roi.toFixed(1)}%`);
    console.log("");
  });

  console.log("\n🎯 Step 5: Adding Custom Pricing");

  // Add custom pricing for a new provider
  tracker.addPricing({
    provider: "google",
    model: "gemini-pro",
    costPerThousandTokens: { input: 0.0005, output: 0.0015 }
  });

  // Record a request with the new pricing
  const geminiCost = tracker.recordCost({
    provider: "google",
    model: "gemini-pro",
    inputTokens: 500,
    outputTokens: 800,
    cacheHit: false
  });

  console.log(`Added Gemini Pro pricing and recorded cost: $${geminiCost.cost.toFixed(4)}`);

  console.log("\n📦 Step 6: Integration with Cache");

  // Example of how to integrate with actual cache operations
  console.log(`\n🔗 Integration Example:`);
  console.log(`   // In your LLM request handler:`);
  console.log(`   const cacheResult = await cache.search(query);`);
  console.log(`   if (cacheResult) {`);
  console.log(`     // Cache hit - record savings`);
  console.log(`     tracker.recordCost({`);
  console.log(`       provider: "openai",`);
  console.log(`       model: "gpt-4",`);
  console.log(`       inputTokens: estimateTokens(query),`);
  console.log(`       outputTokens: estimateTokens(cacheResult.response),`);
  console.log(`       cacheHit: true`);
  console.log(`     });`);
  console.log(`     return cacheResult.response;`);
  console.log(`   } else {`);
  console.log(`     // Cache miss - make API call and record cost`);
  console.log(`     const response = await openai.chat.completions.create(...);`);
  console.log(`     tracker.recordCost({`);
  console.log(`       provider: "openai",`);
  console.log(`       model: "gpt-4",`);
  console.log(`       inputTokens: response.usage.prompt_tokens,`);
  console.log(`       outputTokens: response.usage.completion_tokens,`);
  console.log(`       cacheHit: false`);
  console.log(`     });`);
  console.log(`     await cache.store(query, response);`);
  console.log(`     return response;`);
  console.log(`   }`);

  console.log("\n✅ Cost tracking example completed!");
  console.log("💰 Key Benefits Demonstrated:");
  console.log("   • Real-time cost tracking with provider-specific pricing");
  console.log("   • Automatic savings calculation for cache hits");
  console.log("   • Detailed ROI analysis and projections");
  console.log("   • Cost breakdown by provider and model");
  console.log("   • Easy integration with existing cache systems");
}

// Run the example
if (import.meta.main) {
  runCostTrackingExample().catch(console.error);
}

export { runCostTrackingExample };