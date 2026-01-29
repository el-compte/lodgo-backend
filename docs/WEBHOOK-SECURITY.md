# Webhook Security Documentation

## Overview

This document describes the security measures implemented for webhook endpoints in the Lodgo backend application.

## Security Features

### 1. Signature Verification ✅

**Implementation**: `HostawaySignatureGuard`

**Purpose**: Verify that incoming webhook requests are genuinely from the PMS provider and haven't been tampered with.

**How it works**:
- Each webhook request includes an `x-hostaway-signature` header
- The signature is an HMAC-SHA256 hash of the request body using a shared secret
- The guard recalculates the signature and compares it with the provided one
- Requests with missing or invalid signatures are rejected with `401 Unauthorized`

**Configuration**:
```env
HOSTAWAY_WEBHOOK_SECRET=your-secret-key-here
```

**Code Example**:
```typescript
@Post()
@UseGuards(HostawaySignatureGuard)
handleWebhook(@Body() body: HostawayWebhookDto) {
  // Only executed if signature is valid
}
```

---

### 2. Rate Limiting ✅

**Implementation**: `WebhookRateLimitGuard`

**Purpose**: Prevent abuse and DoS attacks by limiting the number of webhook requests per provider/IP.

**How it works**:
- Tracks request count per provider and identifier (account ID or IP address)
- Uses sliding window algorithm with configurable limits
- Blocks requests exceeding the limit with `429 Too Many Requests`
- Automatically resets after the time window expires
- Cleans up expired entries to prevent memory leaks

**Configuration**:
```env
# Hostaway: 100 requests per minute
HOSTAWAY_RATE_LIMIT_MAX=100
HOSTAWAY_RATE_LIMIT_WINDOW=60000

# Guesty: 100 requests per minute
GUESTY_RATE_LIMIT_MAX=100
GUESTY_RATE_LIMIT_WINDOW=60000
```

**Default Values**:
- Max Requests: 100
- Time Window: 60000ms (1 minute)

**Code Example**:
```typescript
@Post()
@UseGuards(new WebhookRateLimitGuard(100, 60000), HostawaySignatureGuard)
handleWebhook(@Body() body: HostawayWebhookDto) {
  // Rate limited to 100 requests/minute per provider
}
```

---

### 3. Secure Secret Storage ✅

**Implementation**: Environment variables + Configuration module

**Purpose**: Keep webhook secrets secure and separate from code.

**Best Practices**:
- ✅ Secrets stored in environment variables, never in code
- ✅ `.env` file excluded from git via `.gitignore`
- ✅ `.env.example` provided as template (without actual secrets)
- ✅ Centralized configuration in `src/config/configuration.ts`
- ✅ Validation on startup to ensure required secrets are present

**Configuration Structure**:
```typescript
export default () => ({
  webhooks: {
    hostaway: {
      secret: process.env.HOSTAWAY_WEBHOOK_SECRET,
      rateLimit: {
        maxRequests: parseInt(process.env.HOSTAWAY_RATE_LIMIT_MAX || '100', 10),
        windowMs: parseInt(process.env.HOSTAWAY_RATE_LIMIT_WINDOW || '60000', 10),
      },
    },
    guesty: {
      secret: process.env.GUESTY_WEBHOOK_SECRET,
      rateLimit: {
        maxRequests: parseInt(process.env.GUESTY_RATE_LIMIT_MAX || '100', 10),
        windowMs: parseInt(process.env.GUESTY_RATE_LIMIT_WINDOW || '60000', 10),
      },
    },
  },
});
```

---

## Security Flow

```
Incoming Webhook Request
        ↓
┌───────────────────────┐
│  Rate Limit Guard     │ ← Check request count per provider/IP
└───────────────────────┘
        ↓ (if under limit)
┌───────────────────────┐
│  Signature Guard      │ ← Verify HMAC-SHA256 signature
└───────────────────────┘
        ↓ (if valid signature)
┌───────────────────────┐
│  Controller Handler   │ ← Process webhook
└───────────────────────┘
        ↓
┌───────────────────────┐
│  Webhook Service      │ ← Business logic
└───────────────────────┘
```

---

## Acceptance Criteria

### ✅ Unauthorized requests are blocked

**Verification**:
1. **Missing Signature**:
   ```bash
   curl -X POST http://localhost:4000/webhooks/hostaway \
     -H "Content-Type: application/json" \
     -d '{"event":"test"}'
   ```
   **Expected**: `401 Unauthorized - Missing Hostaway signature`

2. **Invalid Signature**:
   ```bash
   curl -X POST http://localhost:4000/webhooks/hostaway \
     -H "Content-Type: application/json" \
     -H "x-hostaway-signature: invalid-signature" \
     -d '{"event":"test"}'
   ```
   **Expected**: `401 Unauthorized - Invalid Hostaway signature`

3. **Valid Signature**:
   ```bash
   # Calculate signature
   SIGNATURE=$(echo -n '{"event":"test"}' | openssl dgst -sha256 -hmac "your-secret" | awk '{print $2}')
   
   curl -X POST http://localhost:4000/webhooks/hostaway \
     -H "Content-Type: application/json" \
     -H "x-hostaway-signature: $SIGNATURE" \
     -d '{"event":"test"}'
   ```
   **Expected**: `200 OK`

---

### ✅ Rate limiting per provider

**Verification**:
1. **Send multiple requests rapidly**:
   ```bash
   for i in {1..105}; do
     curl -X POST http://localhost:4000/webhooks/hostaway \
       -H "Content-Type: application/json" \
       -H "x-hostaway-signature: $SIGNATURE" \
       -d '{"event":"test"}' &
   done
   wait
   ```
   **Expected**: First 100 succeed, remaining get `429 Too Many Requests`

2. **Different providers have separate limits**:
   - 100 Hostaway requests → 100 succeed
   - 100 Guesty requests → 100 succeed (different provider)

3. **Different IPs have separate limits**:
   - 100 requests from IP 1 → 100 succeed
   - 100 requests from IP 2 → 100 succeed (different IP)

---

### ✅ Secrets are securely stored

**Verification**:
1. **No secrets in code**:
   ```bash
   git grep -i "webhook.*secret" src/
   ```
   **Expected**: No hardcoded secret values

2. **Secrets in environment variables**:
   ```bash
   grep WEBHOOK_SECRET .env.example
   ```
   **Expected**: Template entries without actual secrets

3. **Startup validation**:
   - Start application without `HOSTAWAY_WEBHOOK_SECRET`
   - **Expected**: Error thrown when webhook endpoint is called

---

## Testing

### Unit Tests

**Signature Guard Tests**: `hostaway-signature.guard.spec.ts`
- ✅ Allow valid signatures
- ✅ Reject missing signatures
- ✅ Reject invalid signatures
- ✅ Reject mismatched signatures
- ✅ Handle edge cases (empty body, special characters)
- ✅ Configuration validation

**Rate Limit Guard Tests**: `webhook-rate-limit.guard.spec.ts`
- ✅ Allow requests under limit
- ✅ Block requests over limit
- ✅ Reset after window expires
- ✅ Separate limits per provider
- ✅ Separate limits per IP
- ✅ Use account ID when provided
- ✅ Handle X-Forwarded-For headers
- ✅ Include retry-after in error responses

### Running Tests

```bash
# Run all webhook guard tests
npm test -- hostaway-signature.guard.spec.ts
npm test -- webhook-rate-limit.guard.spec.ts

# Run with coverage
npm test -- --coverage hostaway-signature.guard.spec.ts
```

---

## Production Deployment Checklist

- [ ] Set strong `HOSTAWAY_WEBHOOK_SECRET` (min 32 characters, random)
- [ ] Set strong `GUESTY_WEBHOOK_SECRET` (min 32 characters, random)
- [ ] Configure appropriate rate limits based on expected traffic
- [ ] Enable HTTPS for all webhook endpoints
- [ ] Monitor rate limit hits in logs
- [ ] Set up alerts for repeated unauthorized attempts
- [ ] Rotate webhook secrets periodically (e.g., every 90 days)
- [ ] Test webhook signature validation with provider's test events
- [ ] Document secret rotation procedure for team

---

## Monitoring & Logging

### Key Metrics to Track

1. **Unauthorized Attempts**:
   - Log all `401 Unauthorized` responses
   - Alert if > 10 failed attempts from same IP in 5 minutes

2. **Rate Limit Hits**:
   - Log all `429 Too Many Requests` responses
   - Monitor per-provider rate limit utilization

3. **Webhook Processing**:
   - Track successful webhook processing
   - Monitor processing time
   - Alert on processing failures

### Log Examples

```typescript
// In guards
this.logger.warn(`Unauthorized webhook attempt from IP: ${ip}`);
this.logger.warn(`Rate limit exceeded for ${provider} from ${identifier}`);

// In service
this.logger.log(`Successfully processed ${event} for property ${propertyId}`);
this.logger.error(`Failed to process webhook: ${error.message}`);
```

---

## Future Enhancements

- [ ] Implement Redis-based rate limiting for multi-instance deployments
- [ ] Add webhook retry mechanism with exponential backoff
- [ ] Implement webhook event queue (e.g., Bull/BullMQ)
- [ ] Add webhook delivery tracking and analytics
- [ ] Implement IP whitelisting for known PMS providers
- [ ] Add webhook signature verification for Guesty
- [ ] Create admin dashboard to view webhook statistics

---

## Related Documentation

- [PMS Configuration README](./PMS-CONFIG-README.md)
- [Property Service Implementation](../src/property/property.service.ts)
- [Hostaway Webhook Service](../src/webhooks/hostaway/hostaway-webhook.service.ts)

---

**Last Updated**: January 29, 2026  
**Status**: ✅ Production Ready  
**Security Review**: Completed
