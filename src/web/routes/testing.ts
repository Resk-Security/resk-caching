import { z } from "zod";
import { logger } from "../../shared/simple-logger";
import { globalLLMProvider } from "../../providers/factory";
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

// Mock-specific schemas removed (mock endpoints disabled)

/**
 * OpenAI-compatible chat completions endpoint
 */
export async function createChatCompletion(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const data = ChatCompletionSchema.parse(body);
    
    if (!globalLLMProvider) {
      throw new Error('LLM provider not configured. Set api_key_llm or OPENAI_API_KEY or DEEPSEEK_API_KEY');
    }
    const response = await globalLLMProvider.createChatCompletion(data);

    logger.info('Chat completion generated', {
      model: data.model,
      messageCount: data.messages.length
    });

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    logger.error('Chat completion failed', error);
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
    return new Response(JSON.stringify({ success: false, error: 'Mock API disabled' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ success: false, error: 'Mock scenarios disabled' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ success: false, error: 'Mock scenarios disabled' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ success: false, error: 'Mock scenarios disabled' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ success: false, error: 'Mock scenarios disabled' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
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