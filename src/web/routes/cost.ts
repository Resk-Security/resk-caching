import { z } from "zod";
import { logger } from "../../shared/simple-logger";
import { globalCostTracker } from "../../cost/cost-tracker";

/**
 * Cost tracking API routes
 */

// Request schemas
const RecordCostSchema = z.object({
  provider: z.string(),
  model: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cacheHit: z.boolean()
});

const CostAnalysisSchema = z.object({
  periodDays: z.number().optional().default(30)
});

const AddPricingSchema = z.object({
  provider: z.string(),
  model: z.string(),
  costPerThousandTokens: z.object({
    input: z.number(),
    output: z.number()
  })
});

/**
 * Record cost for an API request
 */
export async function recordCost(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const data = RecordCostSchema.parse(body);
    
    const costEntry = globalCostTracker.recordCost(data);
    
    logger.info('Cost recorded via API', {
      id: costEntry.id,
      provider: data.provider,
      model: data.model,
      cost: costEntry.cost
    });

    return new Response(JSON.stringify({
      success: true,
      data: costEntry
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to record cost', error);
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
 * Get cost analysis for a period
 */
export async function getCostAnalysis(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const periodDays = parseInt(url.searchParams.get('periodDays') || '30');
    
    const analysis = globalCostTracker.getCostAnalysis(periodDays);
    
    logger.info('Cost analysis requested', { periodDays });

    return new Response(JSON.stringify({
      success: true,
      data: analysis
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get cost analysis', error);
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
 * Get cost breakdown by provider and model
 */
export async function getCostBreakdown(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const periodDays = parseInt(url.searchParams.get('periodDays') || '30');
    
    const breakdown = globalCostTracker.getCostBreakdown(periodDays);
    
    logger.info('Cost breakdown requested', { periodDays });

    return new Response(JSON.stringify({
      success: true,
      data: breakdown
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get cost breakdown', error);
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
 * Get recent cost entries
 */
export async function getRecentCosts(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const entries = globalCostTracker.getRecentEntries(limit);
    
    logger.info('Recent costs requested', { limit });

    return new Response(JSON.stringify({
      success: true,
      data: entries
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get recent costs', error);
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
 * Add custom pricing for provider/model
 */
export async function addPricing(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const data = AddPricingSchema.parse(body);
    
    globalCostTracker.addPricing(data);
    
    logger.info('Pricing added via API', {
      provider: data.provider,
      model: data.model,
      pricing: data.costPerThousandTokens
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Pricing added successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to add pricing', error);
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
 * Get all configured pricing
 */
export async function getPricing(request: Request): Promise<Response> {
  try {
    const pricing = globalCostTracker.getPricing();
    
    logger.info('Pricing requested');

    return new Response(JSON.stringify({
      success: true,
      data: pricing
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get pricing', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}