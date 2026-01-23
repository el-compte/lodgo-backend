import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { HostawayWebhookService } from './hostaway-webhook.service';
import { HostawayWebhookDto } from './dto/hostaway-webhook.dto';
import { HostawaySignatureGuard } from './guards/hostaway-signature.guard';

@Controller('webhooks/hostaway')
/**
 * Controller to handle Hostaway webhooks
 * @name HostawayWebhookController
 * @description Receives and processes Hostaway webhook events
 * @class
 */
export class HostawayWebhookController {
  constructor(private readonly webhookService: HostawayWebhookService) {}

  @Post()
  @Throttle({
    hostaway: {
      limit: Number.parseInt(process.env.RATE_LIMITER_LIMIT || '100', 10),
      ttl: Number.parseInt(process.env.RATE_LIMITER_TTL || '60000', 10),
    },
  })
  @UseGuards(HostawaySignatureGuard)
  @HttpCode(200)
  /**
   * Handles incoming Hostaway webhook POST requests
   * @name handleHostawayWebhook
   * @param body HostawayWebhookDto containing the webhook payload
   * @returns {Object} Acknowledgment of receipt
   */
  handleHostawayWebhook(@Body() body: HostawayWebhookDto) {
    /** this will be update as async function at the feature */
    this.webhookService.handleWebhook(body);
    return { received: true };
  }
}
