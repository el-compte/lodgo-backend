import { Injectable, Logger } from '@nestjs/common';
import { HostawayWebhookDto } from './dto/hostaway-webhook.dto';
import { HostawayEvent, mapHostawayEvent } from './hostaway-event.mapper';

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

  /**
   * Handles incoming Hostaway webhook payload
   * @name handleWebhook
   * @description Processes the webhook based on the event type
   * @param payload HostawayWebhookDto containing event data
   * @returns {Promise<void>}
   * @notes Currently a synchronous function; to be updated to async in the future important!
   */
  handleWebhook(payload: HostawayWebhookDto): void {
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
        this.handleListingUpdated(payload.data);
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

  private handleListingUpdated(_data: any): void {
    this.logger.log('Listing updated', _data);
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
}
