import { Module } from '@nestjs/common';
import { HostawayWebhookController } from './hostaway-webhook.controller';
import { HostawayWebhookService } from './hostaway-webhook.service';
import { PropertyModule } from '../../property/property.module';
import { BookingModule } from '../../booking/booking.module';
import { WebhookRetryService } from './services/webhook-retry.service';

/**
 * @module HostawayWebhookModule
 * @description
 * Module responsible for handling Hostaway webhooks,
 * including controller, service, and retry logic.
 */
@Module({
  imports: [PropertyModule, BookingModule],
  controllers: [HostawayWebhookController],
  providers: [HostawayWebhookService, WebhookRetryService],
  exports: [WebhookRetryService],
})
export class HostawayWebhookModule {}
