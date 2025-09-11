import { logger } from "../shared/simple-logger";

/**
 * Pricing configuration for different LLM providers
 */
export interface ProviderPricing {
  provider: string;
  model: string;
  costPerThousandTokens: {
    input: number;
    output: number;
  };
}

/**
 * Cost tracking data for a single request
 */
export interface CostEntry {
  id: string;
  timestamp: Date;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  cacheHit: boolean;
  savingsAmount?: number;
}

/**
 * Cost savings analysis result
 */
export interface CostAnalysis {
  totalRequests: number;
  cacheHitRate: number;
  totalCost: number;
  totalSavings: number;
  roiPercentage: number;
  avgCostPerRequest: number;
  avgSavingsPerRequest: number;
  periodStart: Date;
  periodEnd: Date;
  topSavingQueries: Array<{
    query: string;
    savings: number;
    hitCount: number;
  }>;
}

/**
 * Default pricing for popular LLM providers
 */
const DEFAULT_PRICING: ProviderPricing[] = [
  {
    provider: "openai",
    model: "gpt-4",
    costPerThousandTokens: { input: 0.03, output: 0.06 }
  },
  {
    provider: "openai", 
    model: "gpt-3.5-turbo",
    costPerThousandTokens: { input: 0.0015, output: 0.002 }
  },
  {
    provider: "anthropic",
    model: "claude-3-opus",
    costPerThousandTokens: { input: 0.015, output: 0.075 }
  },
  {
    provider: "anthropic",
    model: "claude-3-sonnet", 
    costPerThousandTokens: { input: 0.003, output: 0.015 }
  }
];

/**
 * Tracks costs and calculates savings from LLM API caching
 */
export class CostTracker {
  private costEntries: CostEntry[] = [];
  private pricingConfig: Map<string, ProviderPricing> = new Map();

  constructor(customPricing?: ProviderPricing[]) {
    // Load default pricing
    DEFAULT_PRICING.forEach(pricing => {
      const key = `${pricing.provider}:${pricing.model}`;
      this.pricingConfig.set(key, pricing);
    });

    // Override with custom pricing if provided
    if (customPricing) {
      customPricing.forEach(pricing => {
        const key = `${pricing.provider}:${pricing.model}`;
        this.pricingConfig.set(key, pricing);
      });
    }

    logger.info(`CostTracker initialized with ${this.pricingConfig.size} pricing configurations`);
  }

  /**
   * Record a cost entry for an API request
   */
  recordCost(entry: Omit<CostEntry, 'id' | 'timestamp' | 'cost' | 'savingsAmount'>): CostEntry {
    const cost = this.calculateCost(entry.provider, entry.model, entry.inputTokens, entry.outputTokens);
    
    const costEntry: CostEntry = {
      ...entry,
      id: `cost_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      cost,
      savingsAmount: entry.cacheHit ? cost : undefined
    };

    this.costEntries.push(costEntry);
    
    logger.debug('Cost recorded', {
      id: costEntry.id,
      provider: entry.provider,
      model: entry.model,
      cost,
      cacheHit: entry.cacheHit,
      savings: costEntry.savingsAmount
    });

    return costEntry;
  }

  /**
   * Calculate cost for a request based on token usage
   */
  private calculateCost(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const key = `${provider}:${model}`;
    const pricing = this.pricingConfig.get(key);
    
    if (!pricing) {
      logger.warn(`No pricing found for ${key}, using default rates`);
      // Default fallback pricing
      return (inputTokens * 0.001 + outputTokens * 0.002) / 1000;
    }

    const inputCost = (inputTokens * pricing.costPerThousandTokens.input) / 1000;
    const outputCost = (outputTokens * pricing.costPerThousandTokens.output) / 1000;
    
    return inputCost + outputCost;
  }

  /**
   * Get comprehensive cost analysis for a time period
   */
  getCostAnalysis(periodDays: number = 30): CostAnalysis {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    const periodEntries = this.costEntries.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );

    const totalRequests = periodEntries.length;
    const cacheHits = periodEntries.filter(entry => entry.cacheHit).length;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    const totalCost = periodEntries.reduce((sum, entry) => sum + entry.cost, 0);
    const totalSavings = periodEntries.reduce((sum, entry) => 
      sum + (entry.savingsAmount || 0), 0
    );
    
    const roiPercentage = totalCost > 0 ? (totalSavings / totalCost) * 100 : 0;
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    const avgSavingsPerRequest = totalRequests > 0 ? totalSavings / totalRequests : 0;

    // Calculate top saving queries (would need query text to be stored)
    const topSavingQueries: Array<{ query: string; savings: number; hitCount: number }> = [];
    
    return {
      totalRequests,
      cacheHitRate,
      totalCost,
      totalSavings,
      roiPercentage,
      avgCostPerRequest,
      avgSavingsPerRequest,
      periodStart: startDate,
      periodEnd: endDate,
      topSavingQueries
    };
  }

  /**
   * Get recent cost entries
   */
  getRecentEntries(limit: number = 100): CostEntry[] {
    return this.costEntries
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get cost breakdown by provider and model
   */
  getCostBreakdown(periodDays: number = 30): Array<{
    provider: string;
    model: string;
    totalCost: number;
    totalSavings: number;
    requestCount: number;
    hitRate: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (periodDays * 24 * 60 * 60 * 1000));
    
    const periodEntries = this.costEntries.filter(entry => 
      entry.timestamp >= startDate && entry.timestamp <= endDate
    );

    const breakdown = new Map<string, {
      provider: string;
      model: string;
      totalCost: number;
      totalSavings: number;
      requestCount: number;
      hits: number;
    }>();

    periodEntries.forEach(entry => {
      const key = `${entry.provider}:${entry.model}`;
      const existing = breakdown.get(key) || {
        provider: entry.provider,
        model: entry.model,
        totalCost: 0,
        totalSavings: 0,
        requestCount: 0,
        hits: 0
      };

      existing.totalCost += entry.cost;
      existing.totalSavings += entry.savingsAmount || 0;
      existing.requestCount += 1;
      if (entry.cacheHit) existing.hits += 1;

      breakdown.set(key, existing);
    });

    return Array.from(breakdown.values()).map(item => ({
      ...item,
      hitRate: item.requestCount > 0 ? (item.hits / item.requestCount) * 100 : 0
    }));
  }

  /**
   * Add custom pricing for a provider/model
   */
  addPricing(pricing: ProviderPricing): void {
    const key = `${pricing.provider}:${pricing.model}`;
    this.pricingConfig.set(key, pricing);
    logger.info(`Added pricing for ${key}`, pricing.costPerThousandTokens);
  }

  /**
   * Get all configured pricing
   */
  getPricing(): ProviderPricing[] {
    return Array.from(this.pricingConfig.values());
  }

  /**
   * Clear all cost entries (for testing)
   */
  clear(): void {
    this.costEntries = [];
    logger.info('Cost tracker cleared');
  }
}

// Global cost tracker instance
export const globalCostTracker = new CostTracker();