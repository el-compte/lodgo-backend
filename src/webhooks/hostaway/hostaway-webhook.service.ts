import { Injectable, Logger } from '@nestjs/common';
import { HostawayWebhookDto } from './dto/hostaway-webhook.dto';
import { HostawayEvent, mapHostawayEvent } from './hostaway-event.mapper';
import { PropertyService } from '../../property/property.service';
import { WebhookRetryService } from './services/webhook-retry.service';
import {
  WebhookProcessingResult,
  WebhookProcessingStatus,
} from './interfaces/webhook-processing.interface';

@Injectable()
export class HostawayWebhookService {
  private readonly logger = new Logger(HostawayWebhookService.name);

  constructor(
    private readonly propertyService: PropertyService,
    private readonly retryService: WebhookRetryService,
  ) {}

  /**
   * Handles incoming Hostaway webhook payload
   */
  async handleWebhook(
    payload: HostawayWebhookDto,
  ): Promise<WebhookProcessingResult> {
    const startTime = Date.now();
    const eventType = payload.event || 'unknown';

    this.logger.log({
      message: 'Webhook received',
      provider: 'hostaway',
      eventType,
      timestamp: new Date().toISOString(),
    });

    try {
      if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid webhook payload: payload is not an object');
      }

      if (!payload.event) {
        throw new Error('Invalid webhook payload: missing event field');
      }

      const mappedEvent = mapHostawayEvent(payload.event as HostawayEvent);

      if (!mappedEvent) {
        this.logger.warn({
          message: 'Unhandled event type',
          provider: 'hostaway',
          eventType,
          timestamp: new Date().toISOString(),
        });

        return {
          status: WebhookProcessingStatus.SUCCESS,
          eventType,
          processingTimeMs: Date.now() - startTime,
        };
      }

      const { result, error } = await this.retryService.executeWithRetry(
        async () => this.processWebhookEvent(mappedEvent, payload),
        {
          provider: 'hostaway',
          eventType,
          externalPropertyId: (payload?.data as { id?: string })?.id,
          payload,
        },
      );

      if (error) {
        return {
          status: WebhookProcessingStatus.DEAD_LETTER,
          eventType,
          processingTimeMs: Date.now() - startTime,
          error,
        };
      }

      this.logger.log({
        message: 'Webhook processed successfully',
        provider: 'hostaway',
        eventType,
        propertyId: result?.propertyId,
        processingTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      });

      return {
        status: WebhookProcessingStatus.SUCCESS,
        eventType,
        propertyId: result?.propertyId,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error({
        message: 'Unexpected error processing webhook',
        provider: 'hostaway',
        eventType,
        error: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString(),
      });

      return {
        status: WebhookProcessingStatus.FAILED,
        eventType,
        processingTimeMs: Date.now() - startTime,
        error: {
          provider: 'hostaway',
          eventType,
          errorMessage,
          errorStack,
          attemptNumber: 1,
          timestamp: new Date(),
        },
      };
    }
  }

  /**
   * Processes a mapped webhook event
   */
  private async processWebhookEvent(
    mappedEvent: HostawayEvent,
    payload: HostawayWebhookDto,
  ): Promise<{ propertyId?: string }> {
    switch (mappedEvent) {
      case HostawayEvent.LISTING_UPDATED:
        return this.handleListingUpdated(payload);

      case HostawayEvent.RESERVATION_CREATED:
        this.handleReservationCreated(payload.data);
        return {};

      case HostawayEvent.RESERVATION_UPDATED:
        this.handleReservationUpdated(payload.data);
        return {};

      case HostawayEvent.RESERVATION_CANCELLED:
        this.handleReservationCancelled(payload.data);
        return {};

      default:
        throw new Error(`Unhandled event type: ${String(mappedEvent)}`);
    }
  }

  /**
   * Handles a listing.updated event
   */
  private async handleListingUpdated(
    listingInformation: HostawayWebhookDto,
  ): Promise<{ propertyId?: string }> {
    const externalPropertyId = (listingInformation?.data as { id: string })[
      'id'
    ]?.toString();

    if (!externalPropertyId) {
      throw new Error('External property ID missing in webhook payload');
    }

    const property = await this.propertyService.findByExternalPropertyId(
      'hostaway',
      externalPropertyId,
    );

    if (!property) {
      this.logger.log({
        message: 'Property not found - ignoring webhook',
        provider: 'hostaway',
        externalPropertyId,
        reason: 'no_pms_config',
        timestamp: new Date().toISOString(),
      });
      return {};
    }

    const isEligible =
      await this.propertyService.isPropertyEligibleForWebhookByExternalId(
        'hostaway',
        externalPropertyId,
      );
    const propertyId = String(property?._id);

    if (!isEligible) {
      this.logger.log({
        message: 'Property not eligible for webhook processing',
        provider: 'hostaway',
        propertyId,
        externalPropertyId,
        reason: 'pms_config_disabled_or_invalid',
        timestamp: new Date().toISOString(),
      });
      return { propertyId };
    }

    if (!this.isListingDataValid(listingInformation)) {
      throw new Error(
        `Listing data validation failed for property ${propertyId}`,
      );
    }

    await this.propertyService.syncListingData(
      propertyId,
      listingInformation.data,
    );

    this.logger.log({
      message: 'Successfully processing listing update',
      provider: 'hostaway',
      propertyId,
      externalPropertyId,
      timestamp: new Date().toISOString(),
    });

    return { propertyId };
  }

  private handleReservationCreated(_data: any): void {
    this.logger.log('Reservation created', _data);
  }

  private handleReservationUpdated(_data: any): void {
    this.logger.log('Reservation updated', _data);
  }

  private handleReservationCancelled(_data: any): void {
    this.logger.log('Reservation cancelled', _data);
  }

  /**
   * Validates listing data has required fields and completed status
   */
  private isListingDataValid(listing: HostawayWebhookDto): boolean {
    const requiredFields = [
      'id',
      'name',
      'address',
      'externalListingName',
      'price',
      'guestsIncluded',
      'currencyCode',
      'personCapacity',
      'lat',
      'lng',
    ];

    for (const field of requiredFields) {
      if (!listing.data[field]) {
        this.logger.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    const specialStatus = (listing?.data as { specialStatus?: string })
      ?.specialStatus;

    if (specialStatus?.toLowerCase() !== 'completed') {
      this.logger.warn(
        `Listing status is not completed: ${specialStatus || 'undefined'}`,
      );
      return false;
    }

    return true;
  }
}
