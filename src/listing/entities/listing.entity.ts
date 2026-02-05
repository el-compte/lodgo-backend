import { Document, Schema } from 'mongoose';
import { LocationSchema, ILocation } from './location.entity';
import { PricingSchema, IPricing } from './pricing.entity';
import { CapacitySchema, ICapacity } from './capacity.entity';
import { PoliciesSchema, IPolicies } from './policies.entity';
import { CheckInOutSchema, ICheckInOut } from './checkinout.entity';
import { ContactSchema, IContact } from './contact.entity';

import { ImageSchema, IImage } from './image.entity';
import { BedSchema, IBed } from './bed.entity';
import { ListingPmsConfig, PmsConfigSchema } from './pms-config.entity';

/**
 * Listing Interface
 * Represents a rental listing synced from a PMS (e.g. Hostaway).
 *
 * @interface IListing
 * @extends Document
 */
interface IListing extends Document {
  /** Public title of the listing */
  title: string;

  /** Internal listing name used by PMS */
  internalName?: string;

  /** Description of the listing */
  description?: string;

  /** Primary language of the listing */
  language?: string;

  /** Physical location details */
  location: ILocation;

  /** Guest capacity and room details */
  capacity: ICapacity;

  /** Pricing, fees, and discounts */
  pricing: IPricing;

  /** Check-in and check-out configuration */
  checkInOut: ICheckInOut;

  /** House rules and cancellation policies */
  policies: IPolicies;

  /** Primary contact information */
  contact: IContact[];

  /** Listing images */
  images: IImage[];

  /** Bed configuration */
  beds: IBed[];

  /** PMS synchronization metadata */
  pms?: ListingPmsConfig;

  /** Raw PMS payload for migration & debugging */
  rawPmsData?: Record<string, any>;
}

/**
 * Mongoose Schema for Listing
 * Defines the MongoDB structure for rental listings.
 *
 * @schema
 * @name ListingSchema
 */
const ListingSchema = new Schema<IListing>(
  {
    /** Public title of the listing */
    title: { type: String, required: true },

    /** Internal PMS listing name */
    internalName: { type: String },

    /** Listing description */
    description: { type: String },

    /** Listing language */
    language: { type: String },

    /** Embedded location details */
    location: { type: LocationSchema, required: true },

    /** Embedded capacity details */
    capacity: { type: CapacitySchema },

    /** Embedded pricing configuration */
    pricing: { type: PricingSchema },

    /** Embedded check-in/out rules */
    checkInOut: { type: CheckInOutSchema },

    /** Embedded policies */
    policies: { type: PoliciesSchema },

    /** Embedded contact information */
    contact: { type: [ContactSchema], default: [] },

    /** Listing images */
    images: { type: [ImageSchema], default: [] },

    /** Bed types */
    beds: { type: [BedSchema], default: [] },

    /** PMS metadata */
    pms: { type: PmsConfigSchema, default: null },

    /** Raw PMS data payload */
    rawPmsData: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export { ListingSchema };
export type { IListing };
