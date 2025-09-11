/**
 * Circuit Breaker Tests
 * Validates circuit breaker patterns and resilience features
 */

import { describe, expect, test, beforeEach } from "bun:test";
import { CircuitBreaker, CircuitBreakerManager } from "../src/resilience/circuit-breaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker(
      "test-service",
      {
        failureThreshold: 3,
        resetTimeoutMs: 1000,
        monitoringWindowMs: 5000,
        successThreshold: 2,
        timeout: 500
      },
      {
        enabled: true,
        fallbackCache: true,
        maxRetries: 2,
        retryDelayMs: 100,
        degradedMode: true
      }
    );
  });

  test("should start in closed state", () => {
    const stats = breaker.getStats();
    expect(stats.state).toBe("closed");
    expect(stats.failures).toBe(0);
    expect(stats.successes).toBe(0);
  });

  test("should execute successful operations", async () => {
    const successOperation = () => Promise.resolve("success");
    
    const result = await breaker.execute(successOperation);
    
    expect(result).toBe("success");
    
    const stats = breaker.getStats();
    expect(stats.state).toBe("closed");
    expect(stats.successes).toBe(1);
    expect(stats.failures).toBe(0);
  });

  test("should handle failed operations", async () => {
    const failOperation = () => Promise.reject(new Error("operation failed"));
    
    await expect(breaker.execute(failOperation)).rejects.toThrow("operation failed");
    
    const stats = breaker.getStats();
    expect(stats.failures).toBe(1);
  });

  test("should open after failure threshold", async () => {
    const failOperation = () => Promise.reject(new Error("operation failed"));
    
    // Execute enough failures to trigger circuit opening
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failOperation)).rejects.toThrow();
    }
    
    const stats = breaker.getStats();
    expect(stats.state).toBe("open");
    expect(stats.failures).toBe(3);
  });

  test("should reject fast when circuit is open", async () => {
    const failOperation = () => Promise.reject(new Error("operation failed"));
    
    // Trigger circuit opening
    for (let i = 0; i < 3; i++) {
      await expect(breaker.execute(failOperation)).rejects.toThrow();
    }
    
    // Next operation should fail fast
    const startTime = Date.now();
    await expect(breaker.execute(() => Promise.resolve("success"))).rejects.toThrow();
    const endTime = Date.now();
    
    // Should fail much faster than normal operation
    expect(endTime - startTime).toBeLessThan(100);
  });

  test("should handle timeout", async () => {
    const slowOperation = () => new Promise(resolve => setTimeout(resolve, 1000));
    
    await expect(breaker.execute(slowOperation)).rejects.toThrow("timed out");
  });

  test("should reset statistics", () => {
    const failOperation = () => Promise.reject(new Error("test"));
    
    breaker.execute(failOperation).catch(() => {}); // Ignore rejection
    
    let stats = breaker.getStats();
    expect(stats.failures).toBeGreaterThan(0);
    
    breaker.reset();
    
    stats = breaker.getStats();
    expect(stats.failures).toBe(0);
    expect(stats.successes).toBe(0);
    expect(stats.requests).toBe(0);
  });

  test("should manually close circuit", () => {
    breaker.open(); // Manually open
    
    let stats = breaker.getStats();
    expect(stats.state).toBe("open");
    
    breaker.close(); // Manually close
    
    stats = breaker.getStats();
    expect(stats.state).toBe("closed");
  });
});

describe("CircuitBreakerManager", () => {
  let manager: CircuitBreakerManager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  test("should create and manage circuit breakers", () => {
    const breaker1 = manager.getBreaker("service1");
    const breaker2 = manager.getBreaker("service2");
    
    expect(breaker1).toBeDefined();
    expect(breaker2).toBeDefined();
    expect(breaker1).not.toBe(breaker2);
    
    // Getting same service should return same breaker
    const breaker1Again = manager.getBreaker("service1");
    expect(breaker1Again).toBe(breaker1);
  });

  test("should get all statistics", () => {
    const breaker1 = manager.getBreaker("service1");
    const breaker2 = manager.getBreaker("service2");
    
    const allStats = manager.getAllStats();
    
    expect(allStats).toHaveProperty("service1");
    expect(allStats).toHaveProperty("service2");
    expect(allStats.service1.state).toBe("closed");
    expect(allStats.service2.state).toBe("closed");
  });

  test("should provide health status", () => {
    const breaker1 = manager.getBreaker("service1");
    const breaker2 = manager.getBreaker("service2");
    
    // Initially all services should be healthy
    const health = manager.getHealthStatus();
    
    expect(health.overall).toBe("healthy");
    expect(health.services.service1.status).toBe("healthy");
    expect(health.services.service2.status).toBe("healthy");
    expect(health.services.service1.uptime).toBe(100);
  });

  test("should update health status when circuits open", () => {
    const breaker = manager.getBreaker("service1");
    breaker.open(); // Manually open circuit
    
    const health = manager.getHealthStatus();
    
    expect(health.overall).toBe("critical");
    expect(health.services.service1.status).toBe("critical");
    expect(health.services.service1.state).toBe("open");
  });

  test("should close all circuits", () => {
    const breaker1 = manager.getBreaker("service1");
    const breaker2 = manager.getBreaker("service2");
    
    breaker1.open();
    breaker2.open();
    
    manager.closeAll();
    
    expect(breaker1.getStats().state).toBe("closed");
    expect(breaker2.getStats().state).toBe("closed");
  });

  test("should reset all circuits", () => {
    const breaker1 = manager.getBreaker("service1");
    const breaker2 = manager.getBreaker("service2");
    
    // Simulate some activity
    const failOp = () => Promise.reject(new Error("fail"));
    breaker1.execute(failOp).catch(() => {});
    breaker2.execute(failOp).catch(() => {});
    
    manager.resetAll();
    
    expect(breaker1.getStats().failures).toBe(0);
    expect(breaker2.getStats().failures).toBe(0);
  });
});