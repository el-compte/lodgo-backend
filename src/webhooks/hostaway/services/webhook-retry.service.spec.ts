import { Test, TestingModule } from '@nestjs/testing';
import { WebhookRetryService } from './webhook-retry.service';

/**
 * Unit tests for WebhookRetryService.
 */
describe('WebhookRetryService', () => {
  let service: WebhookRetryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WebhookRetryService],
    }).compile();

    service = module.get<WebhookRetryService>(WebhookRetryService);
    service.clearDeadLetterQueue();
  });

  afterEach(() => {
    service.clearDeadLetterQueue();
  });

  /**
   * Tests retry logic for webhook processing.
   */
  describe('Retry Logic', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const { result, error } = await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'listing.updated',
      });

      expect(result).toBe('success');
      expect(error).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const { result, error } = await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'listing.updated',
      });

      expect(result).toBe('success');
      expect(error).toBeUndefined();
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should add to dead letter queue after max retries', async () => {
      const mockFn = jest
        .fn()
        .mockRejectedValue(new Error('Persistent failure'));

      const { result, error } = await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'listing.updated',
        externalPropertyId: '12345',
      });

      expect(result).toBeUndefined();
      expect(error).toBeDefined();
      expect(error?.errorMessage).toBe('Persistent failure');
      expect(error?.provider).toBe('hostaway');
      expect(error?.eventType).toBe('listing.updated');
      expect(error?.externalPropertyId).toBe('12345');
      expect(mockFn).toHaveBeenCalledTimes(3);

      const deadLetterQueue = service.getDeadLetterQueue();
      expect(deadLetterQueue).toHaveLength(1);
      expect(deadLetterQueue[0].errorMessage).toBe('Persistent failure');
    });

    it('should use exponential backoff for retries', async () => {
      const delays: number[] = [];
      const mockFn = jest.fn().mockRejectedValue(new Error('Retry test'));

      const originalSetTimeout = global.setTimeout;
      jest.spyOn(global, 'setTimeout').mockImplementation((fn, delay) => {
        delays.push(delay as number);
        return originalSetTimeout(fn as () => void, 0);
      });

      await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test',
      });

      expect(delays).toHaveLength(2);
      expect(delays[0]).toBeGreaterThan(0);
      expect(delays[1]).toBeGreaterThan(delays[0]);

      jest.restoreAllMocks();
    }, 10000);
  });

  /**
   * Tests dead letter queue behavior.
   */
  describe('Dead Letter Queue', () => {
    it('should get dead letter queue statistics', async () => {
      const mockFn1 = jest.fn().mockRejectedValue(new Error('Error 1'));
      const mockFn2 = jest.fn().mockRejectedValue(new Error('Error 2'));

      await service.executeWithRetry(mockFn1, {
        provider: 'hostaway',
        eventType: 'listing.updated',
      });

      await service.executeWithRetry(mockFn2, {
        provider: 'guesty',
        eventType: 'reservation.created',
      });

      const stats = service.getDeadLetterStats();
      expect(stats.total).toBe(2);
      expect(stats.byProvider).toEqual({ hostaway: 1, guesty: 1 });
      expect(stats.byEventType).toEqual({
        'listing.updated': 1,
        'reservation.created': 1,
      });
    }, 30000);

    it('should clear dead letter queue', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test',
      });

      expect(service.getDeadLetterQueue()).toHaveLength(1);

      const cleared = service.clearDeadLetterQueue();
      expect(cleared).toBe(1);
      expect(service.getDeadLetterQueue()).toHaveLength(0);
    });

    it('should remove specific item from dead letter queue', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test1',
      });
      await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test2',
      });

      expect(service.getDeadLetterQueue()).toHaveLength(2);

      const removed = service.removeFromDeadLetterQueue(0);
      expect(removed).toBeDefined();
      expect(removed?.eventType).toBe('test1');
      expect(service.getDeadLetterQueue()).toHaveLength(1);
      expect(service.getDeadLetterQueue()[0].eventType).toBe('test2');
    }, 30000);

    it('should respect max dead letter queue size', async () => {
      process.env.WEBHOOK_DEAD_LETTER_MAX_SIZE = '2';
      const newService = new WebhookRetryService();
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));

      await newService.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test1',
      });
      await newService.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test2',
      });
      await newService.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test3',
      });

      const queue = newService.getDeadLetterQueue();
      expect(queue).toHaveLength(2);
      expect(queue[0].eventType).toBe('test2');
      expect(queue[1].eventType).toBe('test3');

      delete process.env.WEBHOOK_DEAD_LETTER_MAX_SIZE;
    }, 30000);
  });

  /**
   * Tests error context information stored in the dead letter queue.
   */
  describe('Error Context', () => {
    it('should include payload in error context', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const payload = { event: 'test', data: { id: '123' } };

      await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test',
        payload,
      });

      const deadLetterQueue = service.getDeadLetterQueue();
      expect(deadLetterQueue[0].payload).toEqual(payload);
    });

    it('should include error stack trace', async () => {
      const mockError = new Error('Test error with stack');
      const mockFn = jest.fn().mockRejectedValue(mockError);

      await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test',
      });

      const deadLetterQueue = service.getDeadLetterQueue();
      expect(deadLetterQueue[0].errorStack).toBeDefined();
      expect(deadLetterQueue[0].errorStack).toContain('Test error with stack');
    });

    it('should include timestamp in error', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
      const beforeTime = new Date();

      await service.executeWithRetry(mockFn, {
        provider: 'hostaway',
        eventType: 'test',
      });

      const afterTime = new Date();
      const deadLetterQueue = service.getDeadLetterQueue();
      const errorTime = deadLetterQueue[0].timestamp;

      expect(errorTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(errorTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });
});
