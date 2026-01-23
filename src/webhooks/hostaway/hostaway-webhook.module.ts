import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { HostawayWebhookController } from './hostaway-webhook.controller';
import { HostawayWebhookService } from './hostaway-webhook.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'hostaway',
        ttl: process.env.RATE_LIMITER_TTL
          ? Number.parseInt(process.env.RATE_LIMITER_TTL, 10)
          : 60000,
        limit: process.env.RATE_LIMITER_LIMIT
          ? Number.parseInt(process.env.RATE_LIMITER_LIMIT, 10)
          : 100,
      },
    ]),
  ],
  controllers: [HostawayWebhookController],
  providers: [HostawayWebhookService],
})
export class HostawayWebhookModule {}
