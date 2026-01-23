import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HostawayWebhookController } from './hostaway-webhook.controller';
import { HostawayWebhookService } from './hostaway-webhook.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'hostaway',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per ttl
      },
    ]),
  ],
  controllers: [HostawayWebhookController],
  providers: [HostawayWebhookService],
})
export class HostawayWebhookModule {}
