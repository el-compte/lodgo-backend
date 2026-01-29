import { Injectable, Logger } from '@nestjs/common';
import { WebhookError } from '../interfaces/webhook-processing.interface';
import configuration from '../../../config/configuration';

/**
 * Configuration for retry strategy
 */
interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Service to handle webhook retries and manage a dead-letter queue for failed webhooks.
 */
@Injectable()
export class WebhookRetryService {
  private readonly logger = new Logger(WebhookRetryService.name);
  private readonly deadLetterQueue: WebhookError[] = [];
  private readonly retryConfig: RetryConfig;

  /**
   * Initializes the service with retry configuration from environment or config.
   */
  constructor() {
    const webhookConfig = configuration().webhooks.hostaway.retry;
    this.retryConfig = {
      maxAttempts: webhookConfig.retryAttempts,
      initialDelayMs: webhookConfig.initialDelayMs,
      maxDelayMs: webhookConfig.maxDelayMs,
      backoffMultiplier: webhookConfig.backoffMultiplier,
    };
  }

  /**
   * Executes a webhook processing function with retry logic.
   * @param processingFn Function that performs the webhook processing
   * @param context Metadata about the webhook event
   * @returns Object containing either the result or the error
   */
  async executeWithRetry<T>(
    processingFn: () => Promise<T>,
    context: {
      provider: string;
      eventType: string;
      externalPropertyId?: string;
      payload?: unknown;
    },
  ): Promise<{ result?: T; error?: WebhookError }> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= this.retryConfig.maxAttempts; attempt++) {
      try {
        const result = await processingFn();

        if (attempt > 1) {
          this.logger.log(
            `[${context.provider}] Successfully processed ${context.eventType} after ${attempt} attempts`,
          );
        }

        return { result };
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `[${context.provider}] Attempt ${attempt}/${this.retryConfig.maxAttempts} failed for ${context.eventType}: ${lastError.message}`,
        );

        if (attempt < this.retryConfig.maxAttempts) {
          const delay = this.calculateBackoffDelay(attempt);
          this.logger.debug(`[${context.provider}] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    const webhookError: WebhookError = {
      provider: context.provider,
      eventType: context.eventType,
      externalPropertyId: context.externalPropertyId,
      errorMessage: lastError?.message || 'Unknown error',
      errorStack: lastError?.stack,
      attemptNumber: this.retryConfig.maxAttempts,
      timestamp: new Date(),
      payload: context.payload,
    };

    this.addToDeadLetterQueue(webhookError);
    return { error: webhookError };
  }

  /**
   * Calculates the exponential backoff delay for a retry attempt.
   * @param attemptNumber Current attempt number (1-based)
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(attemptNumber: number): number {
    const delay =
      this.retryConfig.initialDelayMs *
      Math.pow(this.retryConfig.backoffMultiplier, attemptNumber - 1);
    return Math.min(delay, this.retryConfig.maxDelayMs);
  }

  /**
   * Pauses execution for a specified duration.
   * @param ms Duration in milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Adds a failed webhook to the dead letter queue.
   * @param error Webhook error to add
   */
  private addToDeadLetterQueue(error: WebhookError): void {
    this.deadLetterQueue.push(error);

    this.logger.error(
      `[${error.provider}] Webhook moved to dead letter queue`,
      {
        eventType: error.eventType,
        externalPropertyId: error.externalPropertyId,
        errorMessage: error.errorMessage,
        attempts: error.attemptNumber,
        timestamp: error.timestamp,
      },
    );

    const maxDeadLetterSize = Number.parseInt(
      process.env.WEBHOOK_DEAD_LETTER_MAX_SIZE ?? '1000',
      10,
    );
    if (this.deadLetterQueue.length > maxDeadLetterSize) {
      const removed = this.deadLetterQueue.shift();
      this.logger.warn(
        `Dead letter queue exceeded max size (${maxDeadLetterSize}). Removed oldest entry: ${removed?.eventType}`,
      );
    }
  }

  /**
   * Returns a copy of all items in the dead letter queue.
   * @returns Array of webhook errors
   */
  getDeadLetterQueue(): WebhookError[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Returns statistics about the dead letter queue.
   * @returns Object with total count and counts by provider and event type
   */
  getDeadLetterStats(): {
    total: number;
    byProvider: Record<string, number>;
    byEventType: Record<string, number>;
  } {
    const stats = {
      total: this.deadLetterQueue.length,
      byProvider: {} as Record<string, number>,
      byEventType: {} as Record<string, number>,
    };

    this.deadLetterQueue.forEach((error) => {
      stats.byProvider[error.provider] =
        (stats.byProvider[error.provider] || 0) + 1;
      stats.byEventType[error.eventType] =
        (stats.byEventType[error.eventType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clears all items from the dead letter queue.
   * @returns Number of items removed
   */
  clearDeadLetterQueue(): number {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue.length = 0;
    this.logger.log(`Cleared ${count} items from dead letter queue`);
    return count;
  }

  /**
   * Removes a specific item from the dead letter queue.
   * @param index Index of the item to remove
   * @returns Removed WebhookError or undefined if index invalid
   */
  removeFromDeadLetterQueue(index: number): WebhookError | undefined {
    if (index >= 0 && index < this.deadLetterQueue.length) {
      const removed = this.deadLetterQueue.splice(index, 1)[0];
      this.logger.log(
        `Removed item from dead letter queue: ${removed.eventType}`,
      );
      return removed;
    }
    return undefined;
  }
}
