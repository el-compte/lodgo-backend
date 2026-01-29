import { Module } from '@nestjs/common';
import { HostawayWebhookController } from './hostaway-webhook.controller';
import { HostawayWebhookService } from './hostaway-webhook.service';
import { PropertyModule } from '../../property/property.module';

@Module({
  imports: [PropertyModule],
  controllers: [HostawayWebhookController],
  providers: [HostawayWebhookService],
})
export class HostawayWebhookModule {}
