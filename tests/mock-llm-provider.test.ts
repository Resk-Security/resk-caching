/**
 * Mock LLM Provider Tests
 * Validates mock API functionality and testing capabilities
 */

import { describe, expect, test, beforeEach } from "bun:test";
import { MockLLMProvider } from "../src/mock/mock-llm-provider";

describe("MockLLMProvider", () => {
  let provider: MockLLMProvider;

  beforeEach(() => {
    provider = new MockLLMProvider();
  });

  test("should create OpenAI-compatible chat completions", async () => {
    const request = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user" as const, content: "Hello" }]
    };

    const response = await provider.createChatCompletion(request);

    expect(response.id).toBeDefined();
    expect(response.object).toBe("chat.completion");
    expect(response.model).toBe("gpt-3.5-turbo");
    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].message.role).toBe("assistant");
    expect(response.choices[0].message.content).toBeDefined();
    expect(response.usage.total_tokens).toBeGreaterThan(0);
  });

  test("should handle custom mock responses", async () => {
    provider.addMockResponse({
      id: "test_response",
      trigger: {
        messagePattern: "test message",
        exact: true
      },
      response: {
        content: "This is a test response",
        tokens: { prompt: 10, completion: 15 },
        latencyMs: 100
      },
      metadata: {
        scenario: "testing",
        description: "Test response",
        tags: ["test"]
      }
    });

    const request = {
      model: "gpt-4",
      messages: [{ role: "user" as const, content: "test message" }]
    };

    const response = await provider.createChatCompletion(request);
    expect(response.choices[0].message.content).toBe("This is a test response");
    expect(response.usage.total_tokens).toBe(25); // 10 + 15
  });

  test("should run test scenarios", async () => {
    provider.addTestScenario({
      id: "basic_test",
      name: "Basic Test",
      description: "A basic test scenario",
      requests: [{
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }]
      }],
      expectedResponses: [],
      validations: [
        { type: "response_time", threshold: 1000 },
        { type: "token_count", threshold: 100 }
      ]
    });

    const result = await provider.runTestScenario("basic_test");

    expect(result.scenarioId).toBe("basic_test");
    expect(result.passed).toBe(true);
    expect(result.metrics.totalRequests).toBe(1);
    expect(result.metrics.avgResponseTime).toBeGreaterThan(0);
  });

  test("should run all test scenarios", async () => {
    // Add multiple scenarios
    provider.addTestScenario({
      id: "test1",
      name: "Test 1",
      description: "First test",
      requests: [{
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }]
      }],
      expectedResponses: [],
      validations: [{ type: "response_time", threshold: 1000 }]
    });

    provider.addTestScenario({
      id: "test2",
      name: "Test 2", 
      description: "Second test",
      requests: [{
        model: "gpt-4",
        messages: [{ role: "user", content: "Thank you" }]
      }],
      expectedResponses: [],
      validations: [{ type: "token_count", threshold: 50 }]
    });

    const results = await provider.runAllTestScenarios();

    expect(results).toHaveLength(2);
    expect(results.every(r => r.passed)).toBe(true);
  });

  test("should track request history", async () => {
    const request = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user" as const, content: "Test message" }]
    };

    await provider.createChatCompletion(request);
    await provider.createChatCompletion(request);

    const history = provider.getRequestHistory(5);

    expect(history).toHaveLength(2);
    expect(history[0].request.messages[0].content).toBe("Test message");
    expect(history[0].response).toBeDefined();
    expect(history[0].timestamp).toBeInstanceOf(Date);
  });

  test("should load default test scenarios", () => {
    provider.loadDefaultTestScenarios();
    
    const scenarios = provider.getTestScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
    
    const basicScenario = scenarios.find(s => s.id === "basic_conversation");
    expect(basicScenario).toBeDefined();
    expect(basicScenario!.name).toBe("Basic Conversation Flow");
  });

  test("should get mock responses", () => {
    const responses = provider.getMockResponses();
    expect(Array.isArray(responses)).toBe(true);
    expect(responses.length).toBeGreaterThan(0); // Default responses should exist
    
    const greetingResponse = responses.find(r => r.id === "greeting");
    expect(greetingResponse).toBeDefined();
  });

  test("should clear request history", async () => {
    const request = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user" as const, content: "Test" }]
    };

    await provider.createChatCompletion(request);
    
    let history = provider.getRequestHistory();
    expect(history).toHaveLength(1);

    provider.clear();
    
    history = provider.getRequestHistory();
    expect(history).toHaveLength(0);
  });

  test("should simulate errors when configured", async () => {
    provider.addMockResponse({
      id: "error_response",
      trigger: {
        messagePattern: "error test",
        exact: true
      },
      response: {
        content: "This should error",
        tokens: { prompt: 5, completion: 5 },
        errorRate: 1.0 // 100% error rate
      }
    });

    const request = {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user" as const, content: "error test" }]
    };

    await expect(provider.createChatCompletion(request)).rejects.toThrow();
  });
});