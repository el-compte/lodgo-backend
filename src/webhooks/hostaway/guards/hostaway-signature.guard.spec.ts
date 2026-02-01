import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { HostawaySignatureGuard } from './hostaway-signature.guard';
import * as crypto from 'node:crypto';

/**
 * Unit tests for HostawaySignatureGuard.
 */
describe('HostawaySignatureGuard', () => {
  let guard: HostawaySignatureGuard;
  const testSecret = 'test-webhook-secret-key';
  const originalEnv = process.env.HOSTAWAY_WEBHOOK_SECRET;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HostawaySignatureGuard],
    }).compile();

    guard = module.get<HostawaySignatureGuard>(HostawaySignatureGuard);
    process.env.HOSTAWAY_WEBHOOK_SECRET = testSecret;
  });

  afterEach(() => {
    process.env.HOSTAWAY_WEBHOOK_SECRET = originalEnv;
  });

  /**
   * Creates a mock ExecutionContext for testing.
   * @param signature Optional signature header
   * @param rawBody Raw request body
   * @returns Mocked ExecutionContext
   */
  const createMockExecutionContext = (
    signature?: string,
    rawBody: string = '{"event":"test"}',
  ): ExecutionContext => {
    const request = {
      headers: signature ? { 'x-hostaway-signature': signature } : {},
      rawBody,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  describe('Signature Validation', () => {
    it('allows request with valid signature', () => {
      const rawBody = '{"event":"listing.updated","data":{"id":"12345"}}';
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody)
        .digest('hex');

      const context = createMockExecutionContext(validSignature, rawBody);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('rejects request with missing signature', () => {
      const context = createMockExecutionContext();
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Missing Hostaway signature',
      );
    });

    it('rejects request with invalid signature', () => {
      const context = createMockExecutionContext('invalid-signature');
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Invalid Hostaway signature',
      );
    });

    it('rejects request when signature does not match body', () => {
      const rawBody1 = '{"event":"test1"}';
      const rawBody2 = '{"event":"test2"}';
      const signature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody1)
        .digest('hex');

      const context = createMockExecutionContext(signature, rawBody2);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(() => guard.canActivate(context)).toThrow(
        'Invalid Hostaway signature',
      );
    });
  });

  describe('Configuration', () => {
    it('throws error if HOSTAWAY_WEBHOOK_SECRET is not configured', () => {
      delete process.env.HOSTAWAY_WEBHOOK_SECRET;
      const context = createMockExecutionContext('any-signature');
      expect(() => guard.canActivate(context)).toThrow(
        'HOSTAWAY_WEBHOOK_SECRET not configured',
      );
    });
  });

  describe('Security Edge Cases', () => {
    it('handles empty body', () => {
      const rawBody = '';
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody)
        .digest('hex');

      const context = createMockExecutionContext(validSignature, rawBody);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('handles special characters in body', () => {
      const rawBody = '{"event":"test","data":"special chars: äöü @#$%"}';
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody)
        .digest('hex');

      const context = createMockExecutionContext(validSignature, rawBody);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('is case-sensitive for signature', () => {
      const rawBody = '{"event":"test"}';
      const validSignature = crypto
        .createHmac('sha256', testSecret)
        .update(rawBody)
        .digest('hex');
      const upperCaseSignature = validSignature.toUpperCase();

      const context = createMockExecutionContext(upperCaseSignature, rawBody);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
  });
});
