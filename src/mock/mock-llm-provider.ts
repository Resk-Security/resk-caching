import { logger } from "../shared/simple-logger";

/**
 * OpenAI Chat Completion API compatible request
 */
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
  stream?: boolean;
}

/**
 * OpenAI Chat Completion API compatible response
 */
export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Mock response configuration
 */
export interface MockResponse {
  id: string;
  trigger: {
    modelPattern?: string;
    messagePattern?: string;
    exact?: boolean;
  };
  response: {
    content: string;
    tokens: {
      prompt: number;
      completion: number;
    };
    latencyMs?: number;
    errorRate?: number; // 0-1 probability of error
  };
  metadata?: {
    scenario: string;
    description: string;
    tags: string[];
  };
}

/**
 * Test scenario for automated testing
 */
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  requests: ChatCompletionRequest[];
  expectedResponses: Partial<ChatCompletionResponse>[];
  validations: Array<{
    type: 'response_time' | 'token_count' | 'content_match' | 'cache_hit';
    threshold?: number;
    pattern?: string;
    expected?: boolean;
  }>;
}

/**
 * Test execution result
 */
export interface TestResult {
  scenarioId: string;
  passed: boolean;
  errors: string[];
  metrics: {
    totalRequests: number;
    avgResponseTime: number;
    cacheHitRate: number;
    totalTokens: number;
  };
  timestamp: Date;
}

/**
 * Mock LLM provider that mimics OpenAI's API for testing and development
 */
export class MockLLMProvider {
  private mockResponses: MockResponse[] = [];
  private testScenarios: TestScenario[] = [];
  private requestHistory: Array<{
    request: ChatCompletionRequest;
    response: ChatCompletionResponse;
    timestamp: Date;
    cached: boolean;
  }> = [];

  constructor() {
    this.loadDefaultResponses();
    logger.info('MockLLMProvider initialized with default responses');
  }

  /**
   * Process chat completion request (OpenAI compatible)
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    
    try {
      // Find matching mock response
      const mockResponse = this.findMatchingResponse(request);
      
      if (!mockResponse) {
        throw new Error('No mock response configured for this request');
      }

      // Simulate latency
      if (mockResponse.response.latencyMs) {
        await new Promise(resolve => setTimeout(resolve, mockResponse.response.latencyMs));
      }

      // Simulate errors
      if (mockResponse.response.errorRate && Math.random() < mockResponse.response.errorRate) {
        throw new Error('Simulated API error');
      }

      const response: ChatCompletionResponse = {
        id: `chatcmpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: request.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: mockResponse.response.content
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: mockResponse.response.tokens.prompt,
          completion_tokens: mockResponse.response.tokens.completion,
          total_tokens: mockResponse.response.tokens.prompt + mockResponse.response.tokens.completion
        }
      };

      // Record request/response
      this.requestHistory.push({
        request,
        response,
        timestamp: new Date(),
        cached: false // This would be set by the caching layer
      });

      logger.debug('Mock chat completion generated', {
        id: response.id,
        model: request.model,
        duration: Date.now() - startTime,
        tokens: response.usage.total_tokens
      });

      return response;
    } catch (error) {
      logger.error('Mock chat completion failed', error);
      throw error;
    }
  }

  /**
   * Find mock response matching the request
   */
  private findMatchingResponse(request: ChatCompletionRequest): MockResponse | null {
    // Ensure most recently added custom responses take precedence over defaults
    const responses = [...this.mockResponses].reverse();
    for (const mockResponse of responses) {
      const trigger = mockResponse.trigger;
      
      // Check model pattern
      if (trigger.modelPattern && !this.matchesPattern(request.model, trigger.modelPattern)) {
        continue;
      }

      // Check message pattern
      if (trigger.messagePattern) {
        const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
        if (!this.matchesPattern(userMessage, trigger.messagePattern, trigger.exact)) {
          continue;
        }
      }

      return mockResponse;
    }

    // Provide a deterministic fallback for unknown inputs to avoid hard failures in tests
    return {
      id: 'fallback',
      trigger: { messagePattern: '', exact: false },
      response: {
        content: 'This is a fallback mock response',
        tokens: { prompt: 5, completion: 10 },
        latencyMs: 10,
        errorRate: 0
      },
      metadata: {
        scenario: 'fallback',
        description: 'Default fallback response when no mock matches',
        tags: ['fallback']
      }
    };
  }

  /**
   * Check if text matches pattern
   */
  private matchesPattern(text: string, pattern: string, exact: boolean = false): boolean {
    if (exact) {
      return text.toLowerCase() === pattern.toLowerCase();
    } else {
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
  }

  /**
   * Add custom mock response
   */
  addMockResponse(mockResponse: MockResponse): void {
    this.mockResponses.push(mockResponse);
    logger.info(`Added mock response: ${mockResponse.id}`, {
      trigger: mockResponse.trigger,
      scenario: mockResponse.metadata?.scenario
    });
  }

  /**
   * Load default mock responses for common scenarios
   */
  private loadDefaultResponses(): void {
    const defaultResponses: MockResponse[] = [
      {
        id: 'greeting',
        trigger: {
          messagePattern: 'hello',
          exact: false
        },
        response: {
          content: 'Hello! How can I help you today?',
          tokens: { prompt: 10, completion: 15 },
          latencyMs: 100
        },
        metadata: {
          scenario: 'basic_greeting',
          description: 'Standard greeting response',
          tags: ['greeting', 'basic']
        }
      },
      {
        id: 'thanks',
        trigger: {
          messagePattern: 'thank',
          exact: false
        },
        response: {
          content: 'You\'re welcome! I\'m glad I could help.',
          tokens: { prompt: 15, completion: 20 },
          latencyMs: 80
        },
        metadata: {
          scenario: 'gratitude',
          description: 'Response to thank you messages',
          tags: ['gratitude', 'polite']
        }
      },
      {
        id: 'code_request',
        trigger: {
          messagePattern: 'code',
          exact: false
        },
        response: {
          content: '```javascript\nfunction example() {\n  return "Hello, World!";\n}\n```',
          tokens: { prompt: 25, completion: 40 },
          latencyMs: 200
        },
        metadata: {
          scenario: 'code_generation',
          description: 'Code generation response',
          tags: ['code', 'programming']
        }
      },
      {
        id: 'explain',
        trigger: {
          messagePattern: 'explain',
          exact: false
        },
        response: {
          content: 'I\'d be happy to explain that concept. Here\'s a detailed breakdown...',
          tokens: { prompt: 20, completion: 100 },
          latencyMs: 300
        },
        metadata: {
          scenario: 'explanation',
          description: 'Educational explanation response',
          tags: ['education', 'explanation']
        }
      },
      {
        id: 'error_simulation',
        trigger: {
          messagePattern: 'error',
          exact: false
        },
        response: {
          content: 'This is a test error response',
          tokens: { prompt: 10, completion: 10 },
          latencyMs: 50,
          errorRate: 0.3 // 30% chance of error
        },
        metadata: {
          scenario: 'error_testing',
          description: 'Simulates API errors for testing',
          tags: ['error', 'testing']
        }
      }
    ];

    this.mockResponses = defaultResponses;
  }

  /**
   * Add test scenario
   */
  addTestScenario(scenario: TestScenario): void {
    this.testScenarios.push(scenario);
    logger.info(`Added test scenario: ${scenario.name}`, {
      requests: scenario.requests.length,
      validations: scenario.validations.length
    });
  }

  /**
   * Run automated test scenario
   */
  async runTestScenario(scenarioId: string): Promise<TestResult> {
    const scenario = this.testScenarios.find(s => s.id === scenarioId);
    if (!scenario) {
      throw new Error(`Test scenario not found: ${scenarioId}`);
    }

    const startTime = Date.now();
    const errors: string[] = [];
    const responses: ChatCompletionResponse[] = [];
    let totalTokens = 0;

    logger.info(`Running test scenario: ${scenario.name}`, { scenarioId });

    try {
      // Execute all requests
      for (const request of scenario.requests) {
        const response = await this.createChatCompletion(request);
        responses.push(response);
        totalTokens += response.usage.total_tokens;
      }

      // Run validations
      for (let i = 0; i < scenario.validations.length; i++) {
        const validation = scenario.validations[i];
        const response = responses[i];

        if (validation && response) {
          try {
            this.validateResponse(validation, response, Date.now() - startTime);
          } catch (error) {
            errors.push(`Validation ${i + 1}: ${error}`);
          }
        }
      }

      const avgResponseTime = (Date.now() - startTime) / scenario.requests.length;
      const cacheHitRate = 0; // Would be calculated by caching layer

      return {
        scenarioId,
        passed: errors.length === 0,
        errors,
        metrics: {
          totalRequests: scenario.requests.length,
          avgResponseTime,
          cacheHitRate,
          totalTokens
        },
        timestamp: new Date()
      };
    } catch (error) {
      errors.push(`Execution error: ${error}`);
      return {
        scenarioId,
        passed: false,
        errors,
        metrics: {
          totalRequests: 0,
          avgResponseTime: 0,
          cacheHitRate: 0,
          totalTokens: 0
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Validate response against criteria
   */
  private validateResponse(
    validation: TestScenario['validations'][0], 
    response: ChatCompletionResponse, 
    responseTime: number
  ): void {
    switch (validation.type) {
      case 'response_time':
        if (validation.threshold && responseTime > validation.threshold) {
          throw new Error(`Response time ${responseTime}ms exceeds threshold ${validation.threshold}ms`);
        }
        break;
      
      case 'token_count':
        if (validation.threshold && response.usage.total_tokens > validation.threshold) {
          throw new Error(`Token count ${response.usage.total_tokens} exceeds threshold ${validation.threshold}`);
        }
        break;
      
      case 'content_match':
        if (validation.pattern) {
          const content = response.choices[0]?.message.content || '';
          if (!content.includes(validation.pattern)) {
            throw new Error(`Response content does not contain pattern: ${validation.pattern}`);
          }
        }
        break;
      
      case 'cache_hit':
        // This would be validated by the caching layer
        break;
    }
  }

  /**
   * Run all test scenarios
   */
  async runAllTestScenarios(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (const scenario of this.testScenarios) {
      const result = await this.runTestScenario(scenario.id);
      results.push(result);
    }

    return results;
  }

  /**
   * Get request history
   */
  getRequestHistory(limit: number = 100): typeof this.requestHistory {
    return this.requestHistory
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get test scenarios
   */
  getTestScenarios(): TestScenario[] {
    return this.testScenarios;
  }

  /**
   * Get mock responses
   */
  getMockResponses(): MockResponse[] {
    return this.mockResponses;
  }

  /**
   * Clear history (for testing)
   */
  clear(): void {
    this.requestHistory = [];
    logger.info('Mock LLM provider history cleared');
  }

  /**
   * Load default test scenarios
   */
  loadDefaultTestScenarios(): void {
    const defaultScenarios: TestScenario[] = [
      {
        id: 'basic_conversation',
        name: 'Basic Conversation Flow',
        description: 'Tests basic greeting and response flow',
        requests: [
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello there!' }]
          },
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Thank you for your help' }]
          }
        ],
        expectedResponses: [
          { choices: [{ index: 0, message: { role: 'assistant', content: 'Hello! How can I help you today?' }, finish_reason: 'stop' }] },
          { choices: [{ index: 0, message: { role: 'assistant', content: 'You\'re welcome! I\'m glad I could help.' }, finish_reason: 'stop' }] }
        ],
        validations: [
          { type: 'response_time', threshold: 500 },
          { type: 'content_match', pattern: 'Hello' },
          { type: 'token_count', threshold: 100 }
        ]
      },
      {
        id: 'code_generation',
        name: 'Code Generation Test',
        description: 'Tests code generation capabilities',
        requests: [
          {
            model: 'gpt-4',
            messages: [{ role: 'user', content: 'Write a simple JavaScript function' }]
          }
        ],
        expectedResponses: [
          { choices: [{ index: 0, message: { role: 'assistant', content: 'function example()' }, finish_reason: 'stop' }] }
        ],
        validations: [
          { type: 'content_match', pattern: 'function' },
          { type: 'response_time', threshold: 1000 }
        ]
      }
    ];

    defaultScenarios.forEach(scenario => this.addTestScenario(scenario));
  }
}

// Global mock LLM provider instance
export const globalMockLLMProvider = new MockLLMProvider();