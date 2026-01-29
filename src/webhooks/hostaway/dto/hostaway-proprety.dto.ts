/**
 * Interface representing a Hostaway listing (property).
 * A listing corresponds to a single accommodation unit (apartment, villa, house, etc.).
 *
 * @see https://api.hostaway.com/documentation#listing-object
 */
export interface HostawayListing {
  /* =========================
   * Required fields
   * ========================= */

  /** Unique identifier of the listing in Hostaway */
  id: number;

  /** Public display name of the listing */
  name: string;

  /** Full address of the property */
  address: string;

  /** External listing name used for channel distribution */
  externalListingName: string;

  /** Base nightly price */
  price: number;

  /** Number of guests included in base price */
  guestsIncluded: number;

  /** Additional price per extra guest per night */
  priceForExtraPerson: number;

  /** Currency code (ISO 4217), e.g. USD, EUR */
  currencyCode: string;

  /** ZIP or postal code of the property */
  zipcode: string;

  /** Maximum number of persons allowed */
  personCapacity: number;

  /** Latitude of the property location */
  lat: number;

  /** Longitude of the property location */
  lng: number;

  /* =========================
   * Optional fields – Property details
   * ========================= */

  /** Property type identifier (apartment, house, villa, etc.) */
  propertyTypeId?: number;

  /** Internal name used only inside Hostaway */
  internalListingName?: string;

  /** Full description of the property */
  description?: string;

  /** House rules displayed to guests */
  houseRules?: string;

  /** Instructions for key pickup */
  keyPickup?: string;

  /** Special instructions for guests */
  specialInstruction?: string;

  /** Door access or security code */
  doorSecurityCode?: string;

  /** Country name */
  country?: string;

  /** Country ISO code */
  countryCode?: string;

  /** State or region */
  state?: string;

  /** City name */
  city?: string;

  /** Street name and number */
  street?: string;

  /** Public address shown on booking channels */
  publicAddress?: string;

  /** Star rating assigned to the property */
  starRating?: number;

  /** Average guest review rating */
  averageReviewRating?: number;

  /** Weekly discount percentage */
  weeklyDiscount?: number;

  /** Monthly discount percentage */
  monthlyDiscount?: number;

  /* =========================
   * Taxes & fees
   * ========================= */

  /** Property rent tax amount */
  propertyRentTax?: number;

  /** Per-person per-night tax */
  guestPerPersonPerNightTax?: number;

  /** Per-stay guest tax */
  guestStayTax?: number;

  /** Per-night guest tax */
  guestNightlyTax?: number;

  /** Refundable damage deposit amount */
  refundableDamageDeposit?: number;

  /** Cleaning fee charged per stay */
  cleaningFee?: number;

  /* =========================
   * Capacity & limits
   * ========================= */

  /** Number of bathrooms available to guests */
  guestBathroomsNumber?: number;

  /** Maximum children allowed */
  maxChildrenAllowed?: number;

  /** Maximum infants allowed */
  maxInfantsAllowed?: number;

  /** Maximum pets allowed */
  maxPetsAllowed?: number;

  /* =========================
   * Check-in / Check-out
   * ========================= */

  /** Earliest allowed check-in time (HHmm format) */
  checkInTimeStart?: number;

  /** Latest allowed check-in time (HHmm format) */
  checkInTimeEnd?: number;

  /** Check-out time (HHmm format) */
  checkOutTime?: number;

  /* =========================
   * Cancellation policies
   * ========================= */

  /** General cancellation policy text */
  cancellationPolicy?: string;

  /** Hostaway cancellation policy ID */
  cancellationPolicyId?: number;

  /** VRBO cancellation policy ID */
  vrboCancellationPolicyId?: number;

  /** Airbnb cancellation policy ID */
  airBnbCancellationPolicyId?: number;

  /** Marriott cancellation policy ID */
  marriottCancellationPolicyId?: number;

  /** Booking.com cancellation policy ID */
  bookingCancellationPolicyId?: number;

  /* =========================
   * Property layout
   * ========================= */

  /** Property size in square meters */
  squareMeters?: number;

  /** Special operational status */
  specialStatus?: string;

  /** Room type (entire place, private room, etc.) */
  roomType?: string;

  /** Bathroom type (private, shared, etc.) */
  bathroomType?: string;

  /** Number of bedrooms */
  bedroomsNumber?: number;

  /** Number of beds */
  bedsNumber?: number;

  /** Type of beds */
  bedType?: string;

  /** Number of bathrooms */
  bathroomsNumber?: number;

  /* =========================
   * Stay rules
   * ========================= */

  /** Minimum nights per stay */
  minNights?: number;

  /** Maximum nights per stay */
  maxNights?: number;

  /** Whether instant booking is enabled */
  instantBookable?: number;

  /** Minimum lead time for instant booking */
  instantBookableLeadTime?: number;

  /** Whether same-day booking is allowed */
  allowSameDayBooking?: number;

  /** Lead time required for same-day booking */
  sameDayBookingLeadTime?: number;

  /* =========================
   * Contact information
   * ========================= */

  /** Primary contact first name */
  contactName?: string;

  /** Primary contact last name */
  contactSurName?: string;

  /** Primary contact phone number */
  contactPhone1?: string;

  /** Secondary contact phone number */
  contactPhone2?: string;

  /** Preferred contact language */
  contactLanguage?: string;

  /** Contact email address */
  contactEmail?: string;

  /** Contact physical address */
  contactAddress?: string;

  /* =========================
   * Localization
   * ========================= */

  /** Listing language */
  language?: string;

  /** Timezone name (IANA format) */
  timeZoneName?: string;

  /* =========================
   * Wi-Fi information
   * ========================= */

  /** Wi-Fi username or SSID */
  wifiUsername?: string;

  /** Wi-Fi password */
  wifiPassword?: string;

  /* =========================
   * Cleaning
   * ========================= */

  /** Current cleanliness status */
  cleannessStatus?: string;

  /** Cleaning instructions */
  cleaningInstruction?: string;

  /** Date when cleanliness status was last updated */
  cleannessStatusUpdatedOn?: Date;

  /* =========================
   * Channel-specific content
   * ========================= */

  /** Airbnb listing URL */
  airbnbListingUrl?: string;

  /** VRBO listing URL */
  vrboListingUrl?: string;

  /** Google Vacation Rentals listing URL */
  googleVrListingUrl?: string;

  /* =========================
   * Licensing & compliance
   * ========================= */

  /** Property license number */
  propertyLicenseNumber?: string;

  /** Property license type */
  propertyLicenseType?: string;

  /** License issue date */
  propertyLicenseIssueDate?: Date;

  /** License expiration date */
  propertyLicenseExpirationDate?: Date;

  /* =========================
   * Amenities & media
   * ========================= */

  /** Amenities associated with the listing */
  listingAmenities?: {
    /** Listing amenity relation ID */
    id: number;
    /** Amenity identifier */
    amenityId: number;
  }[];

  /** Bed types configured for the listing */
  listingBedTypes?: {
    /** Bed type relation ID */
    id: number;
    /** Bed type identifier */
    bedTypeId: number;
    /** Quantity of this bed type */
    quantity: number;
  }[];

  /** Images attached to the listing */
  listingImages?: {
    /** Image identifier */
    id: number;
    /** Optional image caption */
    caption?: string;
    /** Image URL */
    url: string;
    /** Display order */
    sortOrder?: number;
  }[];

  /** Custom field values */
  customFieldValues?: {
    /** Custom field identifier */
    customFieldId: number;
    /** Stored value */
    value: string;
  }[];
}
