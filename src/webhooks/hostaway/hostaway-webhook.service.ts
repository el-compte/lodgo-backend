import { Injectable, Logger } from '@nestjs/common';
import { HostawayWebhookDto } from './dto/hostaway-webhook.dto';
import { HostawayEvent, mapHostawayEvent } from './hostaway-event.mapper';
import { PropertyService } from 'src/property/property.service';

@Injectable()
/**
 * Service to handle Hostaway webhooks
 * @name HostawayWebhookService
 * @description Processes incoming Hostaway webhook events
 * @class
 */
export class HostawayWebhookService {
  /** Logger instance for HostawayWebhookService */
  private readonly logger = new Logger(HostawayWebhookService.name);

  constructor(private readonly propertyService: PropertyService) {}

  /**
   * Handles incoming Hostaway webhook payload
   * @name handleWebhook
   * @description Processes the webhook based on the event type
   * @param payload HostawayWebhookDto containing event data
   * @returns {Promise<void>}
   * @notes Currently a synchronous function; to be updated to async in the future important!
   */
  async handleWebhook(payload: HostawayWebhookDto): Promise<void> {
    const mappedEvent = mapHostawayEvent(payload.event as HostawayEvent);

    /** Check if the event is mapped */
    if (!mappedEvent) {
      this.logger.warn(`Unhandled Hostaway event: ${payload.event}`);
      return;
    }

    /** Process the mapped event */
    switch (mappedEvent) {
      /** Handle listing updated event */
      case HostawayEvent.LISTING_UPDATED:
        await this.handleListingUpdated(payload.data);
        break;

      /** Handle reservation created event */
      case HostawayEvent.RESERVATION_CREATED:
        this.handleReservationCreated(payload.data);
        break;

      /** Handle reservation updated event */
      case HostawayEvent.RESERVATION_UPDATED:
        this.handleReservationUpdated(payload.data);
        break;

      /** Handle reservation cancelled event */
      case HostawayEvent.RESERVATION_CANCELLED:
        this.handleReservationCancelled(payload.data);
        break;
    }
  }

  /**
   * Handles listing.updated event and validates PMS config eligibility
   * @param data - Webhook payload data containing listing information
   * @returns Promise<void>
   */
  private async handleListingUpdated(data: any): Promise<void> {
    // Extract external property ID from webhook payload
    const externalPropertyId = data?.id?.toString();
    
    if (!externalPropertyId) {
      this.logger.warn('External property ID missing in webhook payload');
      return;
    }

    // Find property by external property ID and provider
    const property = await this.propertyService.findByExternalPropertyId(
      'hostaway',
      externalPropertyId,
    );

    if (!property) {
      this.logger.log(
        `Property with Hostaway ID ${externalPropertyId} not found - ignoring webhook (no PMS config)`,
      );
      return;
    }

    // Check if property has enabled PMS config for Hostaway
    const isEligible =
      await this.propertyService.isPropertyEligibleForWebhookByExternalId(
        'hostaway',
        externalPropertyId,
      );

    if (!isEligible) {
      this.logger.log(
        `Property ${property._id} (Hostaway ID: ${externalPropertyId}) is not eligible for webhook processing - PMS config disabled or invalid`,
      );
      return;
    }

    // Property is eligible - proceed with webhook processing
    this.logger.log(
      `Property ${property._id} (Hostaway ID: ${externalPropertyId}) is eligible for webhook processing`,
    );

    // Validate listing data fields
    if (!this.isListingDataValid(data)) {
      this.logger.warn(
        `Listing data validation failed for property ${property._id}`,
      );
      return;
    }

    this.logger.log(
      `Successfully processing webhook for property ${property._id}`,
    );
    // TODO: Add actual listing update logic here
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
   * Validates listing data has required fields
   * @param listing - Listing data from webhook
   * @returns true if valid, false otherwise
   */
  private isListingDataValid(listing: any): boolean {
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

    // Check all required fields are present and non-empty
    for (const field of requiredFields) {
      if (!listing[field]) {
        this.logger.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    // Check status completed
    if (listing.specialStatus?.toLowerCase() !== 'completed') {
      this.logger.warn(
        `Listing status is not completed: ${listing.specialStatus}`,
      );
      return false;
    }

    return true;
  }
}
