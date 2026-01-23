export enum HostawayEvent {
  LISTING_UPDATED = 'listing.updated',
  RESERVATION_CREATED = 'reservation.created',
  RESERVATION_UPDATED = 'reservation.updated',
  RESERVATION_CANCELLED = 'reservation.cancelled',
}

/**
 * Maps raw Hostaway event to internal enum
 * @name mapHostawayEvent
 * @param event HostawayEvent value from Hostaway
 * @returns {HostawayEvent | null} Mapped HostawayEvent enum or null if unknown
 */
export function mapHostawayEvent(event: HostawayEvent): HostawayEvent | null {
  switch (event) {
    case HostawayEvent.LISTING_UPDATED:
    case HostawayEvent.RESERVATION_CREATED:
    case HostawayEvent.RESERVATION_UPDATED:
    case HostawayEvent.RESERVATION_CANCELLED:
      return event;

    default:
      return null;
  }
}
