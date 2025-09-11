import { logger } from "../shared/simple-logger";

/**
 * Performance metrics for a cache operation
 */
export interface PerformanceMetric {
  id: string;
  operation: 'get' | 'set' | 'search' | 'warm';
  timestamp: Date;
  duration: number; // milliseconds
  cacheHit: boolean;
  backend: string;
  querySize?: number;
  resultSize?: number;
  errorRate?: number;
}

/**
 * Performance benchmark result
 */
export interface BenchmarkResult {
  operation: string;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
  throughput: number; // operations per second
  errorRate: number;
  sampleSize: number;
}

/**
 * Cache warming strategy configuration
 */
export interface WarmingStrategy {
  strategy: 'popular' | 'recent' | 'scheduled' | 'predictive';
  batchSize: number;
  intervalMs?: number;
  popularityThreshold?: number;
  maxEntries?: number;
}

/**
 * Performance optimization recommendation
 */
export interface OptimizationRecommendation {
  type: 'cache_warming' | 'slow_query_optimization' | 'backend_tuning' | 'memory_optimization';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: number; // percentage
}

/**
 * Slow query detection result
 */
export interface SlowQuery {
  query: string;
  avgDuration: number;
  hitRate: number;
  frequency: number;
  lastSeen: Date;
  recommendation?: string;
}

/**
 * Cache warming progress
 */
export interface WarmingProgress {
  strategy: string;
  totalEntries: number;
  warmedEntries: number;
  progress: number; // percentage
  estimatedTimeRemaining: number; // seconds
  status: 'running' | 'paused' | 'completed' | 'error';
}

/**
 * Optimizes cache performance through monitoring, warming, and recommendations
 */
export class PerformanceOptimizer {
  private metrics: PerformanceMetric[] = [];
  private warmingStrategies: WarmingStrategy[] = [];
  private warmingProgress: Map<string, WarmingProgress> = new Map();
  private isWarming = false;

  constructor() {
    logger.info('PerformanceOptimizer initialized');
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): PerformanceMetric {
    const fullMetric: PerformanceMetric = {
      ...metric,
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.metrics.push(fullMetric);
    
    // Keep only recent metrics to prevent memory issues
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }

    logger.debug('Performance metric recorded', {
      id: fullMetric.id,
      operation: metric.operation,
      duration: metric.duration,
      cacheHit: metric.cacheHit
    });

    return fullMetric;
  }

  /**
   * Get performance benchmarks for different operations
   */
  getBenchmarks(periodHours: number = 24): BenchmarkResult[] {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (periodHours * 60 * 60 * 1000));
    
    const periodMetrics = this.metrics.filter(metric => 
      metric.timestamp >= startTime && metric.timestamp <= endTime
    );

    const operationGroups = new Map<string, PerformanceMetric[]>();
    periodMetrics.forEach(metric => {
      const key = metric.operation;
      if (!operationGroups.has(key)) {
        operationGroups.set(key, []);
      }
      operationGroups.get(key)!.push(metric);
    });

    return Array.from(operationGroups.entries()).map(([operation, metrics]) => {
      const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
      const errors = metrics.filter(m => m.errorRate && m.errorRate > 0).length;
      
      return {
        operation,
        avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
        minDuration: durations[0] || 0,
        maxDuration: durations[durations.length - 1] || 0,
        p95Duration: durations[Math.floor(durations.length * 0.95)] || 0,
        throughput: metrics.length / (periodHours * 3600),
        errorRate: (errors / metrics.length) * 100,
        sampleSize: metrics.length
      };
    });
  }

  /**
   * Detect slow queries that could benefit from optimization
   */
  detectSlowQueries(thresholdMs: number = 100): SlowQuery[] {
    const queryMetrics = new Map<string, PerformanceMetric[]>();
    
    // Group metrics by query (simplified - would need actual query text)
    this.metrics.forEach(metric => {
      if (metric.operation === 'search' || metric.operation === 'get') {
        const key = `${metric.operation}_${metric.querySize || 'unknown'}`;
        if (!queryMetrics.has(key)) {
          queryMetrics.set(key, []);
        }
        queryMetrics.get(key)!.push(metric);
      }
    });

    const slowQueries: SlowQuery[] = [];
    
    queryMetrics.forEach((metrics, query) => {
      const avgDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length;
      const hitRate = (metrics.filter(m => m.cacheHit).length / metrics.length) * 100;
      
      if (avgDuration > thresholdMs) {
        slowQueries.push({
          query,
          avgDuration,
          hitRate,
          frequency: metrics.length,
          lastSeen: new Date(Math.max(...metrics.map(m => m.timestamp.getTime()))),
          recommendation: this.generateSlowQueryRecommendation(avgDuration, hitRate)
        });
      }
    });

    return slowQueries.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Generate optimization recommendations based on performance data
   */
  getOptimizationRecommendations(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const benchmarks = this.getBenchmarks();
    const slowQueries = this.detectSlowQueries();

    // Check for slow cache operations
    const slowBenchmarks = benchmarks.filter(b => b.avgDuration > 50);
    if (slowBenchmarks.length > 0) {
      recommendations.push({
        type: 'backend_tuning',
        priority: 'high',
        description: 'Cache operations are slower than optimal',
        impact: 'Improved response times and better user experience',
        implementation: 'Consider switching cache backend or optimizing current configuration',
        estimatedImprovement: 30
      });
    }

    // Check for low hit rates
    const searchMetrics = this.metrics.filter(m => m.operation === 'search');
    if (searchMetrics.length > 0) {
      const hitRate = (searchMetrics.filter(m => m.cacheHit).length / searchMetrics.length) * 100;
      if (hitRate < 60) {
        recommendations.push({
          type: 'cache_warming',
          priority: 'high',
          description: `Cache hit rate is low (${hitRate.toFixed(1)}%)`,
          impact: 'Reduced API costs and faster response times',
          implementation: 'Implement cache warming strategy for popular queries',
          estimatedImprovement: 80 - hitRate
        });
      }
    }

    // Check for slow queries
    if (slowQueries.length > 0) {
      recommendations.push({
        type: 'slow_query_optimization',
        priority: 'medium',
        description: `${slowQueries.length} slow queries detected`,
        impact: 'Faster query processing and reduced latency',
        implementation: 'Optimize query structure or add specific caching strategies',
        estimatedImprovement: 25
      });
    }

    // Check memory usage (simplified)
    if (this.metrics.length > 8000) {
      recommendations.push({
        type: 'memory_optimization',
        priority: 'low',
        description: 'High memory usage for performance metrics',
        impact: 'Reduced memory footprint',
        implementation: 'Implement metric retention policies or data compression',
        estimatedImprovement: 15
      });
    }

    return recommendations;
  }

  /**
   * Start cache warming with specified strategy
   */
  async startCacheWarming(strategy: WarmingStrategy, cacheInterface?: any): Promise<void> {
    if (this.isWarming) {
      throw new Error('Cache warming already in progress');
    }

    this.isWarming = true;
    const strategyId = `${strategy.strategy}_${Date.now()}`;
    
    const progress: WarmingProgress = {
      strategy: strategy.strategy,
      totalEntries: strategy.maxEntries || 1000,
      warmedEntries: 0,
      progress: 0,
      estimatedTimeRemaining: 0,
      status: 'running'
    };

    this.warmingProgress.set(strategyId, progress);
    logger.info(`Starting cache warming with strategy: ${strategy.strategy}`, { strategyId });

    try {
      await this.executeWarmingStrategy(strategy, strategyId, cacheInterface);
      progress.status = 'completed';
      progress.progress = 100;
    } catch (error) {
      progress.status = 'error';
      logger.error('Cache warming failed', error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Execute cache warming strategy
   */
  private async executeWarmingStrategy(
    strategy: WarmingStrategy, 
    strategyId: string, 
    cacheInterface?: any
  ): Promise<void> {
    const progress = this.warmingProgress.get(strategyId)!;
    const startTime = Date.now();

    switch (strategy.strategy) {
      case 'popular':
        await this.warmPopularQueries(strategy, progress, cacheInterface);
        break;
      case 'recent':
        await this.warmRecentQueries(strategy, progress, cacheInterface);
        break;
      case 'scheduled':
        await this.warmScheduledQueries(strategy, progress, cacheInterface);
        break;
      case 'predictive':
        await this.warmPredictiveQueries(strategy, progress, cacheInterface);
        break;
    }

    const duration = Date.now() - startTime;
    this.recordMetric({
      operation: 'warm',
      duration,
      cacheHit: false,
      backend: 'warming'
    });
  }

  /**
   * Warm cache with popular queries
   */
  private async warmPopularQueries(
    strategy: WarmingStrategy, 
    progress: WarmingProgress, 
    cacheInterface?: any
  ): Promise<void> {
    // Simulate warming popular queries
    const totalEntries = strategy.maxEntries || 1000;
    const batchSize = strategy.batchSize;

    for (let i = 0; i < totalEntries; i += batchSize) {
      const batchEnd = Math.min(i + batchSize, totalEntries);
      
      // Simulate warming batch
      await new Promise(resolve => setTimeout(resolve, 10));
      
      progress.warmedEntries = batchEnd;
      progress.progress = (batchEnd / totalEntries) * 100;
      
      if (strategy.intervalMs) {
        await new Promise(resolve => setTimeout(resolve, strategy.intervalMs));
      }
    }
  }

  /**
   * Warm cache with recent queries
   */
  private async warmRecentQueries(
    strategy: WarmingStrategy, 
    progress: WarmingProgress, 
    cacheInterface?: any
  ): Promise<void> {
    // Similar implementation for recent queries
    await this.warmPopularQueries(strategy, progress, cacheInterface);
  }

  /**
   * Warm cache with scheduled queries
   */
  private async warmScheduledQueries(
    strategy: WarmingStrategy, 
    progress: WarmingProgress, 
    cacheInterface?: any
  ): Promise<void> {
    // Similar implementation for scheduled queries
    await this.warmPopularQueries(strategy, progress, cacheInterface);
  }

  /**
   * Warm cache with predictive queries
   */
  private async warmPredictiveQueries(
    strategy: WarmingStrategy, 
    progress: WarmingProgress, 
    cacheInterface?: any
  ): Promise<void> {
    // Similar implementation for predictive queries
    await this.warmPopularQueries(strategy, progress, cacheInterface);
  }

  /**
   * Generate recommendation for slow query
   */
  private generateSlowQueryRecommendation(avgDuration: number, hitRate: number): string {
    if (hitRate < 30) {
      return 'Consider pre-warming this query or optimizing similarity thresholds';
    } else if (avgDuration > 500) {
      return 'Query processing is very slow - check vector database performance';
    } else {
      return 'Monitor query patterns and consider caching variants';
    }
  }

  /**
   * Get current warming progress
   */
  getWarmingProgress(): WarmingProgress[] {
    return Array.from(this.warmingProgress.values());
  }

  /**
   * Get recent performance metrics
   */
  getRecentMetrics(limit: number = 100): PerformanceMetric[] {
    return this.metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Clear all metrics (for testing)
   */
  clear(): void {
    this.metrics = [];
    this.warmingProgress.clear();
    logger.info('Performance optimizer cleared');
  }
}

// Global performance optimizer instance
export const globalPerformanceOptimizer = new PerformanceOptimizer();