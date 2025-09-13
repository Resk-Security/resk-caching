/**
 * Development and Testing Environment Example
 * 
 * This example demonstrates the MockLLMProvider for offline development
 * and testing with OpenAI-compatible APIs.
 */

import { 
  MockLLMProvider, 
  globalMockLLMProvider,
  ChatCompletionRequest,
  MockResponse,
  TestScenario 
} from "../src/mock/mock-llm-provider";
import { globalLLMProvider } from "../src/providers/factory";

import { 
  CircuitBreakerManager,
  globalCircuitBreakerManager 
} from "../src/resilience/circuit-breaker";

async function runDevelopmentTestingExample() {
  console.log("🧪 Development and Testing Environment Example");
  console.log("===============================================");

  const useReal = !!(Bun.env.api_key_llm || Bun.env.OPENAI_API_KEY || Bun.env.DEEPSEEK_API_KEY);
  const mockProvider = new MockLLMProvider();

  console.log("\n🎭 Step 1: OpenAI-Compatible Mock API");

  // Test the basic OpenAI-compatible endpoint
  const basicRequests: ChatCompletionRequest[] = [
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, how are you?" }]
    },
    {
      model: "gpt-4",
      messages: [{ role: "user", content: "Can you write some code for me?" }]
    },
    {
      model: "gpt-3.5-turbo", 
      messages: [{ role: "user", content: "Thank you for your help!" }]
    }
  ];

  console.log(`\n🤖 Testing Mock Responses:`);
  for (let i = 0; i < basicRequests.length; i++) {
    const request = basicRequests[i];
    try {
      const response = useReal && globalLLMProvider
        ? await globalLLMProvider.createChatCompletion(request)
        : await mockProvider.createChatCompletion(request);
      console.log(`   ${i + 1}. ${request.model}:`);
      console.log(`     Request: "${request.messages[0].content}"`);
      console.log(`     Response: "${response.choices[0].message.content}"`);
      console.log(`     Tokens: ${response.usage.total_tokens}`);
      console.log(`     Latency: ~${Math.random() * 200 + 50}ms`);
      console.log("");
    } catch (error) {
      console.log(`   ${i + 1}. Error: ${error}`);
    }
  }

  console.log("\n🔧 Step 2: Custom Mock Responses");

  // Add custom mock responses for specific scenarios
  const customResponses: MockResponse[] = [
    {
      id: "sql_query",
      trigger: {
        messagePattern: "sql",
        exact: false
      },
      response: {
        content: "SELECT users.name, orders.total FROM users JOIN orders ON users.id = orders.user_id WHERE orders.created_at > '2024-01-01';",
        tokens: { prompt: 25, completion: 35 },
        latencyMs: 150
      },
      metadata: {
        scenario: "database_queries",
        description: "SQL query generation",
        tags: ["sql", "database", "development"]
      }
    },
    {
      id: "api_design",
      trigger: {
        messagePattern: "api design",
        exact: false
      },
      response: {
        content: "Here's a RESTful API design:\n\nGET /api/users - List users\nPOST /api/users - Create user\nGET /api/users/:id - Get user\nPUT /api/users/:id - Update user\nDELETE /api/users/:id - Delete user",
        tokens: { prompt: 30, completion: 80 },
        latencyMs: 200
      },
      metadata: {
        scenario: "api_development",
        description: "API design assistance",
        tags: ["api", "rest", "design"]
      }
    },
    {
      id: "error_simulation",
      trigger: {
        messagePattern: "simulate error",
        exact: false
      },
      response: {
        content: "This will trigger an error for testing",
        tokens: { prompt: 20, completion: 15 },
        latencyMs: 100,
        errorRate: 0.8 // 80% chance of error
      },
      metadata: {
        scenario: "error_testing",
        description: "Error simulation for testing",
        tags: ["error", "testing", "resilience"]
      }
    }
  ];

  customResponses.forEach(response => {
    mockProvider.addMockResponse(response);
  });

  console.log(`✅ Added ${customResponses.length} custom mock responses`);

  // Test custom responses
  const customRequests = [
    { model: "gpt-4", messages: [{ role: "user", content: "Write a SQL query to find recent orders" }] },
    { model: "gpt-3.5-turbo", messages: [{ role: "user", content: "Help me design an API for user management" }] }
  ];

  console.log(`\n🎯 Testing Custom Responses:`);
  for (let i = 0; i < customRequests.length; i++) {
    const request = customRequests[i];
    try {
      const response = await mockProvider.createChatCompletion(request);
      console.log(`   ${i + 1}. Custom Response:`);
      console.log(`     Request: "${request.messages[0].content}"`);
      console.log(`     Response: "${response.choices[0].message.content.substring(0, 100)}..."`);
      console.log("");
    } catch (error) {
      console.log(`   ${i + 1}. Error: ${error}`);
    }
  }

  console.log("\n🧪 Step 3: Automated Test Scenarios");

  // Create test scenarios
  const testScenarios: TestScenario[] = [
    {
      id: "basic_interaction",
      name: "Basic User Interaction",
      description: "Tests basic conversational flow",
      requests: [
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: "Hello" }]
        },
        {
          model: "gpt-3.5-turbo", 
          messages: [{ role: "user", content: "Thank you" }]
        }
      ],
      expectedResponses: [],
      validations: [
        { type: "response_time", threshold: 500 },
        { type: "content_match", pattern: "Hello" },
        { type: "token_count", threshold: 50 }
      ]
    },
    {
      id: "development_workflow",
      name: "Development Workflow",
      description: "Tests common development requests",
      requests: [
        {
          model: "gpt-4",
          messages: [{ role: "user", content: "Write a SQL query for user data" }]
        },
        {
          model: "gpt-4",
          messages: [{ role: "user", content: "Design an API for this" }]
        }
      ],
      expectedResponses: [],
      validations: [
        { type: "content_match", pattern: "SELECT" },
        { type: "content_match", pattern: "API" },
        { type: "response_time", threshold: 1000 }
      ]
    }
  ];

  testScenarios.forEach(scenario => {
    mockProvider.addTestScenario(scenario);
  });

  console.log(`\n🏃‍♂️ Running Test Scenarios:`);
  const results = await mockProvider.runAllTestScenarios();
  
  results.forEach((result, index) => {
    const statusEmoji = result.passed ? "✅" : "❌";
    console.log(`   ${index + 1}. ${statusEmoji} ${result.scenarioId}`);
    console.log(`     Passed: ${result.passed}`);
    console.log(`     Requests: ${result.metrics.totalRequests}`);
    console.log(`     Avg Response Time: ${result.metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`     Total Tokens: ${result.metrics.totalTokens}`);
    
    if (result.errors.length > 0) {
      console.log(`     Errors: ${result.errors.join(", ")}`);
    }
    console.log("");
  });

  console.log("\n🛡️ Step 4: Circuit Breaker and Resilience");

  const circuitManager = globalCircuitBreakerManager;

  // Test circuit breaker with mock API
  console.log(`\n⚡ Testing Circuit Breaker:`);
  
  const apiBreaker = circuitManager.getBreaker('mock-api', {
    failureThreshold: 3,
    resetTimeoutMs: 5000,
    monitoringWindowMs: 10000,
    successThreshold: 2,
    timeout: 1000
  });

  // Simulate API calls with some failures
  const testOperations = [
    () => mockProvider.createChatCompletion({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: "hello" }] }),
    () => mockProvider.createChatCompletion({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: "simulate error" }] }),
    () => mockProvider.createChatCompletion({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: "simulate error" }] }),
    () => mockProvider.createChatCompletion({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: "hello" }] }),
  ];

  for (let i = 0; i < testOperations.length; i++) {
    try {
      await apiBreaker.execute(testOperations[i], { operation: `test_${i + 1}` });
      console.log(`   ${i + 1}. ✅ Operation succeeded`);
    } catch (error) {
      console.log(`   ${i + 1}. ❌ Operation failed: ${error instanceof Error ? error.message : error}`);
    }

    const stats = apiBreaker.getStats();
    console.log(`     Circuit State: ${stats.state.toUpperCase()} | Failures: ${stats.failures}`);
  }

  // Check overall health
  const healthStatus = circuitManager.getHealthStatus();
  console.log(`\n🏥 System Health:`);
  console.log(`   Overall Status: ${healthStatus.overall.toUpperCase()}`);
  Object.entries(healthStatus.services).forEach(([name, service]) => {
    const statusEmoji = service.status === 'healthy' ? '🟢' : service.status === 'degraded' ? '🟡' : '🔴';
    console.log(`   ${statusEmoji} ${name}: ${service.status} (${service.uptime.toFixed(1)}% uptime)`);
  });

  console.log("\n📊 Step 5: Development Metrics");

  // Show request history
  const history = mockProvider.getRequestHistory(5);
  console.log(`\n📋 Recent Request History:`);
  history.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.request.model}:`);
    console.log(`     Request: "${entry.request.messages[0].content}"`);
    console.log(`     Response: "${entry.response.choices[0].message.content.substring(0, 50)}..."`);
    console.log(`     Timestamp: ${entry.timestamp.toISOString()}`);
    console.log(`     Cached: ${entry.cached ? "Yes" : "No"}`);
    console.log("");
  });

  console.log("\n🔗 Step 6: Integration Examples");

  console.log(`\n💻 Development Integration:`);
  console.log(`   // Use in development instead of real API:`);
  console.log(`   const API_BASE = process.env.NODE_ENV === 'development' ?`);
  console.log(`     'http://localhost:3000/api/testing' :`);
  console.log(`     'https://api.openai.com/v1';`);
  console.log(`   `);
  console.log(`   // Standard OpenAI client configuration:`);
  console.log(`   const openai = new OpenAI({`);
  console.log(`     baseURL: \`\${API_BASE}/chat\`,`);
  console.log(`     apiKey: process.env.NODE_ENV === 'development' ? 'mock' : process.env.OPENAI_API_KEY`);
  console.log(`   });`);
  console.log(`   `);
  console.log(`   // Works exactly like OpenAI API:`);
  console.log(`   const response = await openai.chat.completions.create({`);
  console.log(`     model: "gpt-3.5-turbo",`);
  console.log(`     messages: [{ role: "user", content: "Hello!" }]`);
  console.log(`   });`);

  console.log(`\n🧪 Testing Integration:`);
  console.log(`   // Automated testing with scenarios:`);
  console.log(`   describe('LLM Integration', () => {`);
  console.log(`     beforeEach(() => {`);
  console.log(`       mockProvider.loadDefaultTestScenarios();`);
  console.log(`     });`);
  console.log(`   `);
  console.log(`     it('should handle basic interactions', async () => {`);
  console.log(`       const result = await mockProvider.runTestScenario('basic_interaction');`);
  console.log(`       expect(result.passed).toBe(true);`);
  console.log(`       expect(result.metrics.avgResponseTime).toBeLessThan(500);`);
  console.log(`     });`);
  console.log(`   });`);

  console.log("\n✅ Development and testing example completed!");
  console.log("🧪 Key Benefits Demonstrated:");
  console.log("   • OpenAI-compatible API for offline development");
  console.log("   • Custom mock responses for specific scenarios");
  console.log("   • Automated test scenarios with validation");
  console.log("   • Circuit breaker patterns for resilience");
  console.log("   • Request history and metrics tracking");
  console.log("   • Seamless integration with existing code");
}

// Run the example
if (import.meta.main) {
  runDevelopmentTestingExample().catch(console.error);
}

export { runDevelopmentTestingExample };