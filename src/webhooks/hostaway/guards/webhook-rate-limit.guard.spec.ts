import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { WebhookRateLimitGuard } from './webhook-rate-limit.guard';

/**
 * Unit tests for WebhookRateLimitGuard.
 */
describe('WebhookRateLimitGuard', () => {
  let guard: WebhookRateLimitGuard;

  /**
   * Creates a mock ExecutionContext for testing.
   * @param provider Name of the webhook provider
   * @param ip IP address of the request
   * @param accountId Optional account ID header
   * @returns Mocked ExecutionContext
   */
  const createMockExecutionContext = (
    provider: string = 'hostaway',
    ip: string = '192.168.1.1',
    accountId?: string,
  ): ExecutionContext => {
    const headers: Record<string, string> = { 'x-forwarded-for': ip };

    if (accountId) {
      headers[`x-${provider}-account-id`] = accountId;
    }

    const request = {
      path: `/webhooks/${provider}`,
      headers,
      socket: { remoteAddress: ip },
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: WebhookRateLimitGuard,
          useValue: new WebhookRateLimitGuard(5, 1000),
        },
      ],
    }).compile();

    guard = module.get<WebhookRateLimitGuard>(WebhookRateLimitGuard);
  });

  describe('Rate Limiting', () => {
    it('allows requests under the limit', () => {
      const context = createMockExecutionContext();

      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(context)).toBe(true);
      }
    });

    it('blocks requests over the limit', () => {
      const context = createMockExecutionContext();

      for (let i = 0; i < 5; i++) {
        guard.canActivate(context);
      }

      expect(() => guard.canActivate(context)).toThrow(HttpException);

      try {
        guard.canActivate(context);
      } catch (error) {
        const httpException = error as HttpException;
        const response = httpException.getResponse() as Record<string, unknown>;
        expect(response.statusCode).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(response.message).toContain('Rate limit exceeded');
      }
    });

    it('resets limit after window expires', async () => {
      const context = createMockExecutionContext();

      for (let i = 0; i < 5; i++) {
        guard.canActivate(context);
      }

      await new Promise((resolve) => setTimeout(resolve, 1100));
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Per-Provider Rate Limiting', () => {
    it('tracks limits separately for different providers', () => {
      const hostawayContext = createMockExecutionContext('hostaway');
      const guestyContext = createMockExecutionContext('guesty');

      for (let i = 0; i < 5; i++) {
        guard.canActivate(hostawayContext);
      }

      expect(guard.canActivate(guestyContext)).toBe(true);
    });

    it('tracks limits separately for different IPs', () => {
      const context1 = createMockExecutionContext('hostaway', '192.168.1.1');
      const context2 = createMockExecutionContext('hostaway', '192.168.1.2');

      for (let i = 0; i < 5; i++) {
        guard.canActivate(context1);
      }

      expect(guard.canActivate(context2)).toBe(true);
    });

    it('prioritizes account ID over IP', () => {
      const context1 = createMockExecutionContext(
        'hostaway',
        '192.168.1.1',
        'account-123',
      );
      const context2 = createMockExecutionContext(
        'hostaway',
        '192.168.1.2',
        'account-123',
      );

      for (let i = 0; i < 5; i++) {
        guard.canActivate(context1);
      }

      expect(() => guard.canActivate(context2)).toThrow(HttpException);
    });
  });

  describe('Error Responses', () => {
    it('includes retry-after in error response', () => {
      const context = createMockExecutionContext();

      for (let i = 0; i < 5; i++) {
        guard.canActivate(context);
      }

      try {
        guard.canActivate(context);
      } catch (error) {
        const httpException = error as HttpException;
        const response = httpException.getResponse() as Record<string, unknown>;
        expect(response.retryAfter).toBeDefined();
        expect(typeof response.retryAfter).toBe('number');
      }
    });

    it('includes provider name in error message', () => {
      const context = createMockExecutionContext();

      for (let i = 0; i < 5; i++) {
        guard.canActivate(context);
      }

      try {
        guard.canActivate(context);
      } catch (error) {
        const httpException = error as HttpException;
        const response = httpException.getResponse() as Record<string, unknown>;
        expect(response.message).toContain('hostaway');
      }
    });
  });

  describe('X-Forwarded-For Handling', () => {
    it('uses first IP from X-Forwarded-For header', () => {
      const headers = {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1, 192.0.2.1',
      };
      const request = {
        path: '/webhooks/hostaway',
        headers,
        socket: { remoteAddress: '192.168.1.1' },
      };

      const context = {
        switchToHttp: () => ({ getRequest: () => request }),
      } as ExecutionContext;

      for (let i = 0; i < 5; i++) {
        expect(guard.canActivate(context)).toBe(true);
      }

      expect(() => guard.canActivate(context)).toThrow(HttpException);
    });
  });
});
