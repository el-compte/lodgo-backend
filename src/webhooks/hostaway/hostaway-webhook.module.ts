import { Module } from '@nestjs/common';
import { HostawayWebhookController } from './hostaway-webhook.controller';
import { HostawayWebhookService } from './hostaway-webhook.service';
import { ListingModule } from '../../listing/listing.module';
import { WebhookRetryService } from './services/webhook-retry.service';

/**
 * @module HostawayWebhookModule
 * @description
 * Module responsible for handling Hostaway webhooks,
 * including controller, service, and retry logic.
 */
@Module({
  imports: [ListingModule],
  controllers: [HostawayWebhookController],
  providers: [HostawayWebhookService, WebhookRetryService],
  exports: [WebhookRetryService],
})
export class HostawayWebhookModule {}
