import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Represents a record for rate limiting.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Guard to enforce rate limiting on webhook requests.
 */
@Injectable()
export class WebhookRateLimitGuard implements CanActivate {
  private readonly rateLimitMap = new Map<string, RateLimitRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * Creates an instance of WebhookRateLimitGuard.
   * @param maxRequests Maximum allowed requests per window (default: 100)
   * @param windowMs Time window in milliseconds (default: 60000)
   */
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Determines whether the current request is allowed.
   * @param context Execution context of the request
   * @returns `true` if request is allowed, otherwise throws an HttpException
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provider = this.getProvider(request);
    const identifier = this.getIdentifier(request, provider);
    const key = `${provider}:${identifier}`;

    const now = Date.now();
    const record = this.rateLimitMap.get(key);

    if (!record || now > record.resetTime) {
      this.rateLimitMap.set(key, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (record.count >= this.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Rate limit exceeded for ${provider}. Try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    return true;
  }

  /**
   * Extracts the provider name from the request path.
   * @param request Express request object
   * @returns Provider name or 'unknown' if not found
   */
  private getProvider(request: Request): string {
    const pathParts = request.path.split('/');
    return pathParts[pathParts.length - 1] || 'unknown';
  }

  /**
   * Determines a unique identifier for rate limiting based on provider.
   * @param request Express request object
   * @param provider Name of the provider
   * @returns Identifier string (account ID or IP address)
   */
  private getIdentifier(request: Request, provider: string): string {
    const accountIdHeader = request.headers[
      `x-${provider}-account-id`
    ] as string;
    if (accountIdHeader) return accountIdHeader;

    const forwardedFor = request.headers['x-forwarded-for'] as string;
    return forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : request.socket.remoteAddress || 'unknown';
  }

  /**
   * Cleans up expired entries from the rate limit map.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.rateLimitMap.entries()) {
      if (now > record.resetTime) this.rateLimitMap.delete(key);
    }
  }
}
