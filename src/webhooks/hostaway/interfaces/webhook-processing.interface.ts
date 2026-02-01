/**
 * Webhook processing status enum
 */
export enum WebhookProcessingStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying',
  DEAD_LETTER = 'dead_letter',
}

/**
 * Webhook error details for structured logging
 */
export interface WebhookError {
  provider: string;
  eventType: string;
  externalPropertyId?: string;
  propertyId?: string;
  errorMessage: string;
  errorStack?: string;
  attemptNumber: number;
  timestamp: Date;
  payload?: unknown;
}

/**
 * Webhook processing result
 */
export interface WebhookProcessingResult {
  status: WebhookProcessingStatus;
  propertyId?: string;
  eventType: string;
  processingTimeMs: number;
  error?: WebhookError;
}
