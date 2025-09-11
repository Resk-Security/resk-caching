/**
 * Cost Tracker Tests
 * Validates cost tracking functionality and ROI calculations
 */

import { describe, expect, test, beforeEach } from "bun:test";
import { CostTracker } from "../src/cost/cost-tracker";

describe("CostTracker", () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  test("should record costs correctly", () => {
    const cost = tracker.recordCost({
      provider: "openai",
      model: "gpt-4",
      inputTokens: 100,
      outputTokens: 200,
      cacheHit: false
    });

    expect(cost.cost).toBeGreaterThan(0);
    expect(cost.provider).toBe("openai");
    expect(cost.model).toBe("gpt-4");
    expect(cost.cacheHit).toBe(false);
  });

  test("should calculate savings for cache hits", () => {
    const cost = tracker.recordCost({
      provider: "openai",
      model: "gpt-4",
      inputTokens: 100,
      outputTokens: 200,
      cacheHit: true
    });

    expect(cost.savingsAmount).toBe(cost.cost);
  });

  test("should provide cost analysis", () => {
    // Record some costs
    tracker.recordCost({
      provider: "openai",
      model: "gpt-4",
      inputTokens: 100,
      outputTokens: 200,
      cacheHit: false
    });

    tracker.recordCost({
      provider: "openai",
      model: "gpt-4",
      inputTokens: 100,
      outputTokens: 200,
      cacheHit: true
    });

    const analysis = tracker.getCostAnalysis(1);
    
    expect(analysis.totalRequests).toBe(2);
    expect(analysis.cacheHitRate).toBe(50);
    expect(analysis.totalCost).toBeGreaterThan(0);
    expect(analysis.totalSavings).toBeGreaterThan(0);
    expect(analysis.roiPercentage).toBeGreaterThan(0);
  });

  test("should provide cost breakdown by provider", () => {
    tracker.recordCost({
      provider: "openai",
      model: "gpt-4",
      inputTokens: 100,
      outputTokens: 200,
      cacheHit: false
    });

    tracker.recordCost({
      provider: "anthropic",
      model: "claude-3-opus",
      inputTokens: 150,
      outputTokens: 250,
      cacheHit: true
    });

    const breakdown = tracker.getCostBreakdown(1);
    
    expect(breakdown).toHaveLength(2);
    expect(breakdown.find(b => b.provider === "openai")).toBeDefined();
    expect(breakdown.find(b => b.provider === "anthropic")).toBeDefined();
  });

  test("should add custom pricing", () => {
    tracker.addPricing({
      provider: "custom",
      model: "test-model",
      costPerThousandTokens: { input: 0.001, output: 0.002 }
    });

    const pricing = tracker.getPricing();
    expect(pricing.find(p => p.provider === "custom")).toBeDefined();
  });
});