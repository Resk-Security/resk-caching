import { logger } from "../shared/simple-logger";

/**
 * Circuit breaker state
 */
export type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  resetTimeoutMs: number; // Time to wait before trying again
  monitoringWindowMs: number; // Window for counting failures
  successThreshold: number; // Successes needed to close from half-open
  timeout: number; // Request timeout in ms
}

/**
 * Circuit breaker statistics
 */
export interface CircuitStats {
  state: CircuitState;
  failures: number;
  successes: number;
  requests: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
}

/**
 * Failover strategy configuration
 */
export interface FailoverConfig {
  enabled: boolean;
  fallbackCache: boolean; // Use cache even with lower similarity
  fallbackResponse?: string; // Default response when all fails
  maxRetries: number;
  retryDelayMs: number;
  degradedMode: boolean; // Continue with reduced functionality
}

/**
 * Request execution context
 */
export interface ExecutionContext {
  operation: string;
  startTime: Date;
  retries: number;
  lastError?: Error;
}

/**
 * Circuit breaker implementation for handling failures and protecting services
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private successes = 0;
  private requests = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private nextAttemptTime?: Date;
  private recentFailures: Date[] = [];

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
    private failoverConfig: FailoverConfig
  ) {
    logger.info(`Circuit breaker initialized: ${name}`, { config, failoverConfig });
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    context: Partial<ExecutionContext> = {}
  ): Promise<T> {
    const execContext: ExecutionContext = {
      operation: context.operation || 'unknown',
      startTime: new Date(),
      retries: context.retries || 0,
      lastError: context.lastError
    };

    this.requests++;

    // Check if circuit is open
    if (this.state === 'open') {
      if (this.canAttemptReset()) {
        this.state = 'half-open';
        this.successes = 0;
        logger.info(`Circuit breaker ${this.name} moved to half-open state`);
      } else {
        const error = new Error(`Circuit breaker ${this.name} is open`);
        await this.handleFailover(error, execContext);
        throw error;
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(operation, this.config.timeout);
      await this.onSuccess(execContext);
      return result;
    } catch (error) {
      await this.onFailure(error as Error, execContext);
      throw error;
    }
  }

  /**
   * Execute operation with timeout
   */
  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      operation()
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Handle successful operation
   */
  private async onSuccess(context: ExecutionContext): Promise<void> {
    this.lastSuccessTime = new Date();
    this.successes++;

    if (this.state === 'half-open') {
      if (this.successes >= this.config.successThreshold) {
        this.state = 'closed';
        this.failures = 0;
        this.recentFailures = [];
        logger.info(`Circuit breaker ${this.name} closed after successful recovery`);
      }
    } else if (this.state === 'open') {
      // Should not happen, but reset if it does
      this.state = 'closed';
      this.failures = 0;
      this.recentFailures = [];
    }

    logger.debug(`Circuit breaker ${this.name} success`, {
      operation: context.operation,
      state: this.state,
      successes: this.successes
    });
  }

  /**
   * Handle failed operation
   */
  private async onFailure(error: Error, context: ExecutionContext): Promise<void> {
    this.lastFailureTime = new Date();
    this.failures++;
    this.recentFailures.push(new Date());
    
    // Clean old failures outside monitoring window
    const cutoff = new Date(Date.now() - this.config.monitoringWindowMs);
    this.recentFailures = this.recentFailures.filter(date => date > cutoff);

    // Check if we should open the circuit
    if (this.state === 'closed' && this.recentFailures.length >= this.config.failureThreshold) {
      this.state = 'open';
      this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs);
      logger.warn(`Circuit breaker ${this.name} opened due to failures`, {
        failures: this.recentFailures.length,
        threshold: this.config.failureThreshold
      });
    } else if (this.state === 'half-open') {
      this.state = 'open';
      this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs);
      logger.warn(`Circuit breaker ${this.name} reopened during half-open state`);
    }

    await this.handleFailover(error, context);

    logger.debug(`Circuit breaker ${this.name} failure`, {
      operation: context.operation,
      state: this.state,
      failures: this.recentFailures.length,
      error: error.message
    });
  }

  /**
   * Handle failover logic
   */
  private async handleFailover(error: Error, context: ExecutionContext): Promise<void> {
    if (!this.failoverConfig.enabled) {
      return;
    }

    // Retry logic
    if (context.retries < this.failoverConfig.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, this.failoverConfig.retryDelayMs));
      logger.info(`Retrying operation ${context.operation}, attempt ${context.retries + 1}`);
      return;
    }

    // Fallback to cache if configured
    if (this.failoverConfig.fallbackCache) {
      logger.info('Falling back to cache with relaxed similarity threshold');
      // This would be handled by the calling code
    }

    // Use default response if configured
    if (this.failoverConfig.fallbackResponse) {
      logger.info('Using fallback response due to service failure');
      // This would be handled by the calling code
    }

    // Enter degraded mode if configured
    if (this.failoverConfig.degradedMode) {
      logger.warn('Entering degraded mode due to service failures');
      // This would be handled by the calling code
    }
  }

  /**
   * Check if circuit can attempt reset
   */
  private canAttemptReset(): boolean {
    return this.nextAttemptTime ? new Date() >= this.nextAttemptTime : false;
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      requests: this.requests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  /**
   * Manually close the circuit (for testing)
   */
  close(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.recentFailures = [];
    this.nextAttemptTime = undefined;
    logger.info(`Circuit breaker ${this.name} manually closed`);
  }

  /**
   * Manually open the circuit (for testing)
   */
  open(): void {
    this.state = 'open';
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs);
    logger.info(`Circuit breaker ${this.name} manually opened`);
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.requests = 0;
    this.recentFailures = [];
    this.lastFailureTime = undefined;
    this.lastSuccessTime = undefined;
    this.nextAttemptTime = undefined;
    logger.info(`Circuit breaker ${this.name} statistics reset`);
  }
}

/**
 * Circuit breaker manager for handling multiple services
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Create or get circuit breaker for a service
   */
  getBreaker(
    name: string,
    config?: CircuitBreakerConfig,
    failoverConfig?: FailoverConfig
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        resetTimeoutMs: 60000,
        monitoringWindowMs: 60000,
        successThreshold: 3,
        timeout: 30000
      };

      const defaultFailoverConfig: FailoverConfig = {
        enabled: true,
        fallbackCache: true,
        maxRetries: 3,
        retryDelayMs: 1000,
        degradedMode: true
      };

      const breaker = new CircuitBreaker(
        name,
        config || defaultConfig,
        failoverConfig || defaultFailoverConfig
      );

      this.breakers.set(name, breaker);
    }

    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitStats> {
    const stats: Record<string, CircuitStats> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  /**
   * Get health status of all services
   */
  getHealthStatus(): {
    overall: 'healthy' | 'degraded' | 'critical';
    services: Record<string, {
      status: 'healthy' | 'degraded' | 'critical';
      state: CircuitState;
      uptime: number;
    }>;
  } {
    const services: Record<string, any> = {};
    let healthyCount = 0;
    let degradedCount = 0;
    let criticalCount = 0;

    this.breakers.forEach((breaker, name) => {
      const stats = breaker.getStats();
      let status: 'healthy' | 'degraded' | 'critical';

      if (stats.state === 'closed') {
        status = 'healthy';
        healthyCount++;
      } else if (stats.state === 'half-open') {
        status = 'degraded';
        degradedCount++;
      } else {
        status = 'critical';
        criticalCount++;
      }

      const uptime = stats.requests > 0 ? 
        ((stats.requests - stats.failures) / stats.requests) * 100 : 100;

      services[name] = {
        status,
        state: stats.state,
        uptime
      };
    });

    let overall: 'healthy' | 'degraded' | 'critical';
    if (criticalCount > 0) {
      overall = 'critical';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    return { overall, services };
  }

  /**
   * Close all circuit breakers
   */
  closeAll(): void {
    this.breakers.forEach(breaker => breaker.close());
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Global circuit breaker manager
export const globalCircuitBreakerManager = new CircuitBreakerManager();