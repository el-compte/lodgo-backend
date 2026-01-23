import { IsString, IsObject, IsOptional } from 'class-validator';

/**
 * DTO for Hostaway Webhook payload
 * @see https://www.hostaway.com/docs/api/webhooks
 *
 */
export class HostawayWebhookDto {
  /**
   * Event name sent by Hostaway
   * example: "listing.updated", "reservation.created"
   */
  @IsString()
  event: string;

  /**
   * Event timestamp (ISO string)
   */
  @IsOptional()
  @IsString()
  timestamp?: string;

  /**
   * Actual payload data
   */
  @IsObject()
  data: Record<string, any>;
}
