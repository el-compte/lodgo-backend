import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { HostawayWebhookService } from './hostaway-webhook.service';
import { HostawayWebhookDto } from './dto/hostaway-webhook.dto';
import { HostawaySignatureGuard } from './guards/hostaway-signature.guard';
import { WebhookRateLimitGuard } from './guards/webhook-rate-limit.guard';
import configuration from '../../config/configuration';

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
  @UseGuards(
    new WebhookRateLimitGuard(
      Number.parseInt(
        configuration().webhooks.hostaway.rateLimit.maxRequests,
        10,
      ),
      Number.parseInt(configuration().webhooks.hostaway.rateLimit.windowMs, 10),
    ),
    HostawaySignatureGuard,
  )
  @HttpCode(200)
  /**
   * Handles incoming Hostaway webhook POST requests
   * @name handleHostawayWebhook
   * @param body HostawayWebhookDto containing the webhook payload
   * @returns {Object} Acknowledgment of receipt
   */
  async handleHostawayWebhook(@Body() body: HostawayWebhookDto) {
    /** this will be update as async function at the feature */
    await this.webhookService.handleWebhook(body);
    return { received: true };
  }
}
