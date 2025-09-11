/**
 * Performance Optimizer Tests
 * Validates performance monitoring and optimization features
 */

import { describe, expect, test, beforeEach } from "bun:test";
import { PerformanceOptimizer } from "../src/performance/performance-optimizer";

describe("PerformanceOptimizer", () => {
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
  });

  test("should record performance metrics", () => {
    const metric = optimizer.recordMetric({
      operation: "search",
      duration: 45,
      cacheHit: true,
      backend: "redis",
      querySize: 150
    });

    expect(metric.operation).toBe("search");
    expect(metric.duration).toBe(45);
    expect(metric.cacheHit).toBe(true);
    expect(metric.backend).toBe("redis");
    expect(metric.id).toBeDefined();
    expect(metric.timestamp).toBeInstanceOf(Date);
  });

  test("should provide performance benchmarks", () => {
    // Record some metrics
    optimizer.recordMetric({
      operation: "search",
      duration: 45,
      cacheHit: true,
      backend: "redis"
    });

    optimizer.recordMetric({
      operation: "search", 
      duration: 120,
      cacheHit: false,
      backend: "redis"
    });

    optimizer.recordMetric({
      operation: "set",
      duration: 25,
      cacheHit: false,
      backend: "redis"
    });

    const benchmarks = optimizer.getBenchmarks(1);
    
    expect(benchmarks).toHaveLength(2); // search and set operations
    
    const searchBenchmark = benchmarks.find(b => b.operation === "search");
    expect(searchBenchmark).toBeDefined();
    expect(searchBenchmark!.avgDuration).toBe(82.5); // (45 + 120) / 2
    expect(searchBenchmark!.sampleSize).toBe(2);
  });

  test("should detect slow queries", () => {
    // Record a slow query
    optimizer.recordMetric({
      operation: "search",
      duration: 200, // Slow
      cacheHit: false,
      backend: "memory",
      querySize: 300
    });

    // Record a fast query
    optimizer.recordMetric({
      operation: "search",
      duration: 30, // Fast
      cacheHit: true,
      backend: "memory",
      querySize: 150
    });

    const slowQueries = optimizer.detectSlowQueries(100); // 100ms threshold
    
    expect(slowQueries).toHaveLength(1);
    expect(slowQueries[0].avgDuration).toBe(200);
    expect(slowQueries[0].recommendation).toBeDefined();
  });

  test("should provide optimization recommendations", () => {
    // Create conditions that trigger recommendations
    for (let i = 0; i < 10; i++) {
      optimizer.recordMetric({
        operation: "search",
        duration: 80, // Slightly slow
        cacheHit: i % 3 === 0, // Low hit rate (~33%)
        backend: "memory"
      });
    }

    const recommendations = optimizer.getOptimizationRecommendations();
    
    expect(recommendations).toBeDefined();
    expect(Array.isArray(recommendations)).toBe(true);
    
    // Should recommend cache warming due to low hit rate
    const cacheWarmingRec = recommendations.find(r => r.type === "cache_warming");
    expect(cacheWarmingRec).toBeDefined();
  });

  test("should track cache warming progress", async () => {
    const strategy = {
      strategy: "popular" as const,
      batchSize: 5,
      maxEntries: 20
    };

    // Start warming (this will run async)
    const warmingPromise = optimizer.startCacheWarming(strategy);
    
    // Check initial progress
    const progress = optimizer.getWarmingProgress();
    expect(progress).toBeDefined();
    expect(Array.isArray(progress)).toBe(true);

    // Wait for completion
    await warmingPromise;
    
    // Check final progress
    const finalProgress = optimizer.getWarmingProgress();
    if (finalProgress.length > 0) {
      expect(finalProgress[0].status).toBe("completed");
      expect(finalProgress[0].progress).toBe(100);
    }
  });

  test("should get recent metrics", () => {
    // Record some metrics
    for (let i = 0; i < 5; i++) {
      optimizer.recordMetric({
        operation: "get",
        duration: 10 + i,
        cacheHit: true,
        backend: "memory"
      });
    }

    const recentMetrics = optimizer.getRecentMetrics(3);
    
    expect(recentMetrics).toHaveLength(3);
    expect(recentMetrics[0].timestamp.getTime()).toBeGreaterThanOrEqual(
      recentMetrics[1].timestamp.getTime()
    ); // Should be sorted by timestamp descending
  });

  test("should clear metrics", () => {
    optimizer.recordMetric({
      operation: "search",
      duration: 45,
      cacheHit: true,
      backend: "redis"
    });

    let metrics = optimizer.getRecentMetrics(10);
    expect(metrics).toHaveLength(1);

    optimizer.clear();
    
    metrics = optimizer.getRecentMetrics(10);
    expect(metrics).toHaveLength(0);
  });
});