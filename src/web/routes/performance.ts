import { z } from "zod";
import { logger } from "../../shared/simple-logger";
import { globalPerformanceOptimizer, WarmingStrategy } from "../../performance/performance-optimizer";

/**
 * Performance optimization API routes
 */

// Request schemas
const RecordMetricSchema = z.object({
  operation: z.enum(['get', 'set', 'search', 'warm']),
  duration: z.number(),
  cacheHit: z.boolean(),
  backend: z.string(),
  querySize: z.number().optional(),
  resultSize: z.number().optional(),
  errorRate: z.number().optional()
});

const BenchmarkSchema = z.object({
  periodHours: z.number().optional().default(24)
});

const SlowQuerySchema = z.object({
  thresholdMs: z.number().optional().default(100)
});

const WarmingStrategySchema = z.object({
  strategy: z.enum(['popular', 'recent', 'scheduled', 'predictive']),
  batchSize: z.number(),
  intervalMs: z.number().optional(),
  popularityThreshold: z.number().optional(),
  maxEntries: z.number().optional()
});

/**
 * Record performance metric
 */
export async function recordMetric(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const data = RecordMetricSchema.parse(body);
    
    const metric = globalPerformanceOptimizer.recordMetric(data);
    
    logger.info('Performance metric recorded via API', {
      id: metric.id,
      operation: data.operation,
      duration: data.duration
    });

    return new Response(JSON.stringify({
      success: true,
      data: metric
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to record metric', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get performance benchmarks
 */
export async function getBenchmarks(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const periodHours = parseInt(url.searchParams.get('periodHours') || '24');
    
    const benchmarks = globalPerformanceOptimizer.getBenchmarks(periodHours);
    
    logger.info('Performance benchmarks requested', { periodHours });

    return new Response(JSON.stringify({
      success: true,
      data: benchmarks
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get benchmarks', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Detect slow queries
 */
export async function getSlowQueries(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const thresholdMs = parseInt(url.searchParams.get('thresholdMs') || '100');
    
    const slowQueries = globalPerformanceOptimizer.detectSlowQueries(thresholdMs);
    
    logger.info('Slow queries requested', { thresholdMs });

    return new Response(JSON.stringify({
      success: true,
      data: slowQueries
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get slow queries', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get optimization recommendations
 */
export async function getOptimizationRecommendations(request: Request): Promise<Response> {
  try {
    const recommendations = globalPerformanceOptimizer.getOptimizationRecommendations();
    
    logger.info('Optimization recommendations requested');

    return new Response(JSON.stringify({
      success: true,
      data: recommendations
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get optimization recommendations', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Start cache warming
 */
export async function startCacheWarming(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const strategy = WarmingStrategySchema.parse(body) as WarmingStrategy;
    
    // Start warming asynchronously
    globalPerformanceOptimizer.startCacheWarming(strategy).catch(error => {
      logger.error('Cache warming failed', error);
    });
    
    logger.info('Cache warming started via API', { strategy: strategy.strategy });

    return new Response(JSON.stringify({
      success: true,
      message: 'Cache warming started'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to start cache warming', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get cache warming progress
 */
export async function getWarmingProgress(request: Request): Promise<Response> {
  try {
    const progress = globalPerformanceOptimizer.getWarmingProgress();
    
    logger.info('Warming progress requested');

    return new Response(JSON.stringify({
      success: true,
      data: progress
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get warming progress', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get recent performance metrics
 */
export async function getRecentMetrics(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const metrics = globalPerformanceOptimizer.getRecentMetrics(limit);
    
    logger.info('Recent metrics requested', { limit });

    return new Response(JSON.stringify({
      success: true,
      data: metrics
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get recent metrics', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}