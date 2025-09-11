import { z } from "zod";
import { logger } from "../../shared/simple-logger";
import { globalMockLLMProvider, MockResponse, TestScenario } from "../../mock/mock-llm-provider";
import { globalCircuitBreakerManager } from "../../resilience/circuit-breaker";

/**
 * Mock LLM and testing API routes
 */

// Request schemas
const ChatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  max_tokens: z.number().optional(),
  temperature: z.number().optional(),
  top_p: z.number().optional(),
  frequency_penalty: z.number().optional(),
  presence_penalty: z.number().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  stream: z.boolean().optional()
});

const MockResponseSchema = z.object({
  id: z.string(),
  trigger: z.object({
    modelPattern: z.string().optional(),
    messagePattern: z.string().optional(),
    exact: z.boolean().optional()
  }),
  response: z.object({
    content: z.string(),
    tokens: z.object({
      prompt: z.number(),
      completion: z.number()
    }),
    latencyMs: z.number().optional(),
    errorRate: z.number().optional()
  }),
  metadata: z.object({
    scenario: z.string(),
    description: z.string(),
    tags: z.array(z.string())
  }).optional()
});

const TestScenarioSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  requests: z.array(ChatCompletionSchema),
  expectedResponses: z.array(z.object({}).passthrough()),
  validations: z.array(z.object({
    type: z.enum(['response_time', 'token_count', 'content_match', 'cache_hit']),
    threshold: z.number().optional(),
    pattern: z.string().optional(),
    expected: z.boolean().optional()
  }))
});

/**
 * OpenAI-compatible chat completions endpoint
 */
export async function createChatCompletion(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const data = ChatCompletionSchema.parse(body);
    
    const response = await globalMockLLMProvider.createChatCompletion(data);
    
    logger.info('Mock chat completion generated', {
      model: data.model,
      messageCount: data.messages.length
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Mock chat completion failed', error);
    return new Response(JSON.stringify({
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: 'invalid_request_error',
        code: 'invalid_request'
      }
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Add custom mock response
 */
export async function addMockResponse(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const mockResponse = MockResponseSchema.parse(body) as MockResponse;
    
    globalMockLLMProvider.addMockResponse(mockResponse);
    
    logger.info('Mock response added via API', {
      id: mockResponse.id,
      scenario: mockResponse.metadata?.scenario
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Mock response added successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to add mock response', error);
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
 * Get all mock responses
 */
export async function getMockResponses(request: Request): Promise<Response> {
  try {
    const responses = globalMockLLMProvider.getMockResponses();
    
    logger.info('Mock responses requested');

    return new Response(JSON.stringify({
      success: true,
      data: responses
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get mock responses', error);
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
 * Add test scenario
 */
export async function addTestScenario(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const scenario = TestScenarioSchema.parse(body) as TestScenario;
    
    globalMockLLMProvider.addTestScenario(scenario);
    
    logger.info('Test scenario added via API', {
      id: scenario.id,
      name: scenario.name
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Test scenario added successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to add test scenario', error);
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
 * Run test scenario
 */
export async function runTestScenario(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const scenarioId = url.searchParams.get('scenarioId');
    
    if (!scenarioId) {
      throw new Error('scenarioId parameter is required');
    }
    
    const result = await globalMockLLMProvider.runTestScenario(scenarioId);
    
    logger.info('Test scenario executed via API', {
      scenarioId,
      passed: result.passed
    });

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to run test scenario', error);
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
 * Run all test scenarios
 */
export async function runAllTestScenarios(request: Request): Promise<Response> {
  try {
    const results = await globalMockLLMProvider.runAllTestScenarios();
    
    logger.info('All test scenarios executed via API', {
      totalScenarios: results.length,
      passed: results.filter(r => r.passed).length
    });

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to run all test scenarios', error);
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
 * Get test scenarios
 */
export async function getTestScenarios(request: Request): Promise<Response> {
  try {
    const scenarios = globalMockLLMProvider.getTestScenarios();
    
    logger.info('Test scenarios requested');

    return new Response(JSON.stringify({
      success: true,
      data: scenarios
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get test scenarios', error);
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
 * Get request history
 */
export async function getRequestHistory(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const history = globalMockLLMProvider.getRequestHistory(limit);
    
    logger.info('Request history requested', { limit });

    return new Response(JSON.stringify({
      success: true,
      data: history
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get request history', error);
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
 * Load default test scenarios
 */
export async function loadDefaultTestScenarios(request: Request): Promise<Response> {
  try {
    globalMockLLMProvider.loadDefaultTestScenarios();
    
    logger.info('Default test scenarios loaded');

    return new Response(JSON.stringify({
      success: true,
      message: 'Default test scenarios loaded successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to load default test scenarios', error);
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
 * Get circuit breaker health status
 */
export async function getHealthStatus(request: Request): Promise<Response> {
  try {
    const healthStatus = globalCircuitBreakerManager.getHealthStatus();
    
    logger.info('Health status requested');

    return new Response(JSON.stringify({
      success: true,
      data: healthStatus
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get health status', error);
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
 * Get circuit breaker statistics
 */
export async function getCircuitBreakerStats(request: Request): Promise<Response> {
  try {
    const stats = globalCircuitBreakerManager.getAllStats();
    
    logger.info('Circuit breaker stats requested');

    return new Response(JSON.stringify({
      success: true,
      data: stats
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Failed to get circuit breaker stats', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}