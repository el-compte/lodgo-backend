import { Module } from '@nestjs/common';
import { HostawayWebhookController } from './hostaway-webhook.controller';
import { HostawayWebhookService } from './hostaway-webhook.service';

@Module({
  controllers: [HostawayWebhookController],
  providers: [HostawayWebhookService],
})
export class HostawayWebhookModule {}
