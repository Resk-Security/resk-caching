/**
 * Performance Optimization and Cache Warming Example
 * 
 * This example demonstrates performance monitoring, optimization
 * recommendations, and cache warming strategies.
 */

import { 
  PerformanceOptimizer, 
  globalPerformanceOptimizer,
  WarmingStrategy,
  OptimizationRecommendation 
} from "../src/performance/performance-optimizer";

async function runPerformanceOptimizationExample() {
  console.log("🚀 Performance Optimization Example");
  console.log("====================================");

  const optimizer = new PerformanceOptimizer();

  console.log("\n📊 Step 1: Recording Performance Metrics");

  // Simulate recording various performance metrics
  const metrics = [
    { operation: 'search', duration: 45, cacheHit: true, backend: 'redis', querySize: 150 },
    { operation: 'search', duration: 120, cacheHit: false, backend: 'redis', querySize: 200 },
    { operation: 'set', duration: 25, cacheHit: false, backend: 'redis', resultSize: 1024 },
    { operation: 'get', duration: 15, cacheHit: true, backend: 'redis' },
    { operation: 'search', duration: 200, cacheHit: false, backend: 'memory', querySize: 300 },
    { operation: 'search', duration: 35, cacheHit: true, backend: 'memory', querySize: 180 },
    { operation: 'set', duration: 10, cacheHit: false, backend: 'memory', resultSize: 2048 },
    { operation: 'get', duration: 5, cacheHit: true, backend: 'memory' },
  ] as const;

  metrics.forEach((metric, index) => {
    const recorded = optimizer.recordMetric(metric);
    console.log(`  ${index + 1}. ${metric.operation} (${metric.backend}): ${metric.duration}ms ${metric.cacheHit ? '✅' : '❌'}`);
  });

  console.log("\n📈 Step 2: Performance Benchmarks");

  // Get performance benchmarks
  const benchmarks = optimizer.getBenchmarks(1); // 1 hour period
  console.log(`\n🎯 Performance Benchmarks:`);
  benchmarks.forEach(benchmark => {
    console.log(`   ${benchmark.operation.toUpperCase()}:`);
    console.log(`     Average Duration: ${benchmark.avgDuration.toFixed(2)}ms`);
    console.log(`     Min Duration: ${benchmark.minDuration.toFixed(2)}ms`);
    console.log(`     Max Duration: ${benchmark.maxDuration.toFixed(2)}ms`);
    console.log(`     95th Percentile: ${benchmark.p95Duration.toFixed(2)}ms`);
    console.log(`     Throughput: ${benchmark.throughput.toFixed(2)} ops/sec`);
    console.log(`     Error Rate: ${benchmark.errorRate.toFixed(2)}%`);
    console.log(`     Sample Size: ${benchmark.sampleSize}`);
    console.log("");
  });

  console.log("\n🐌 Step 3: Slow Query Detection");

  // Detect slow queries
  const slowQueries = optimizer.detectSlowQueries(50); // 50ms threshold
  console.log(`\n⚠️  Slow Queries (>50ms):`);
  if (slowQueries.length === 0) {
    console.log("   No slow queries detected! 🎉");
  } else {
    slowQueries.forEach((query, index) => {
      console.log(`   ${index + 1}. ${query.query}:`);
      console.log(`     Average Duration: ${query.avgDuration.toFixed(2)}ms`);
      console.log(`     Hit Rate: ${query.hitRate.toFixed(1)}%`);
      console.log(`     Frequency: ${query.frequency} times`);
      console.log(`     Recommendation: ${query.recommendation}`);
      console.log("");
    });
  }

  console.log("\n💡 Step 4: Optimization Recommendations");

  // Get optimization recommendations
  const recommendations = optimizer.getOptimizationRecommendations();
  console.log(`\n🔧 Optimization Recommendations:`);
  if (recommendations.length === 0) {
    console.log("   Everything looks optimal! 🌟");
  } else {
    recommendations.forEach((rec, index) => {
      const priorityEmoji = rec.priority === 'high' ? '🔥' : rec.priority === 'medium' ? '⚡' : '📋';
      console.log(`   ${index + 1}. ${priorityEmoji} ${rec.type.toUpperCase()} (${rec.priority} priority)`);
      console.log(`     Description: ${rec.description}`);
      console.log(`     Impact: ${rec.impact}`);
      console.log(`     Implementation: ${rec.implementation}`);
      console.log(`     Estimated Improvement: ${rec.estimatedImprovement}%`);
      console.log("");
    });
  }

  console.log("\n🔥 Step 5: Cache Warming Strategies");

  // Define warming strategies
  const strategies: WarmingStrategy[] = [
    {
      strategy: 'popular',
      batchSize: 10,
      maxEntries: 100,
      popularityThreshold: 5
    },
    {
      strategy: 'recent',
      batchSize: 5,
      maxEntries: 50,
      intervalMs: 1000
    },
    {
      strategy: 'predictive',
      batchSize: 15,
      maxEntries: 200
    }
  ];

  console.log(`\n🌡️  Cache Warming Demonstration:`);
  for (const strategy of strategies) {
    console.log(`\n   Starting ${strategy.strategy} warming strategy...`);
    
    // Start cache warming (this would run asynchronously in real usage)
    try {
      await optimizer.startCacheWarming(strategy);
      console.log(`   ✅ ${strategy.strategy} warming completed successfully`);
    } catch (error) {
      console.log(`   ❌ ${strategy.strategy} warming failed: ${error}`);
    }

    // Check progress
    const progress = optimizer.getWarmingProgress();
    if (progress.length > 0) {
      const latest = progress[progress.length - 1];
      console.log(`   Progress: ${latest.progress.toFixed(1)}% (${latest.warmedEntries}/${latest.totalEntries})`);
      console.log(`   Status: ${latest.status}`);
    }
  }

  console.log("\n📊 Step 6: Performance Monitoring Dashboard");

  // Simulate a monitoring dashboard
  console.log(`\n🎛️  Performance Dashboard:`);
  console.log(`   ┌─────────────────────────────────────┐`);
  console.log(`   │         CACHE PERFORMANCE           │`);
  console.log(`   ├─────────────────────────────────────┤`);
  
  const recentMetrics = optimizer.getRecentMetrics(20);
  const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
  const hitRate = (recentMetrics.filter(m => m.cacheHit).length / recentMetrics.length) * 100;
  
  console.log(`   │ Average Response Time: ${avgDuration.toFixed(2)}ms     │`);
  console.log(`   │ Cache Hit Rate: ${hitRate.toFixed(1)}%            │`);
  console.log(`   │ Total Operations: ${recentMetrics.length}              │`);
  console.log(`   │ Status: ${recommendations.length === 0 ? 'OPTIMAL 🟢' : 'NEEDS ATTENTION 🟡'} │`);
  console.log(`   └─────────────────────────────────────┘`);

  console.log("\n🔗 Step 7: Integration with Cache Systems");

  console.log(`\n📝 Integration Examples:`);
  console.log(`   // Record cache operation performance:`);
  console.log(`   const startTime = performance.now();`);
  console.log(`   const result = await cache.search(query);`);
  console.log(`   const duration = performance.now() - startTime;`);
  console.log(`   `);
  console.log(`   optimizer.recordMetric({`);
  console.log(`     operation: 'search',`);
  console.log(`     duration,`);
  console.log(`     cacheHit: !!result,`);
  console.log(`     backend: 'redis',`);
  console.log(`     querySize: query.length`);
  console.log(`   });`);
  console.log(`   `);
  console.log(`   // Proactive cache warming:`);
  console.log(`   if (hitRate < 60) {`);
  console.log(`     await optimizer.startCacheWarming({`);
  console.log(`       strategy: 'popular',`);
  console.log(`       batchSize: 20,`);
  console.log(`       maxEntries: 500`);
  console.log(`     });`);
  console.log(`   }`);

  console.log("\n✅ Performance optimization example completed!");
  console.log("🚀 Key Benefits Demonstrated:");
  console.log("   • Real-time performance monitoring and benchmarking");
  console.log("   • Automatic slow query detection and recommendations");
  console.log("   • Intelligent cache warming strategies");
  console.log("   • Performance optimization recommendations");
  console.log("   • Easy integration with existing cache systems");
}

// Run the example
if (import.meta.main) {
  runPerformanceOptimizationExample().catch(console.error);
}

export { runPerformanceOptimizationExample };