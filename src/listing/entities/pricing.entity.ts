import { Schema } from 'mongoose';

/**
 * Pricing Interface
 * Represents pricing configuration, fees, and discounts for a listing.
 * Values are typically synced from a PMS such as Hostaway.
 *
 * @interface
 * @namespace IPricing
 */
interface IPricing {
  /** Base nightly price of the listing */
  basePrice?: number;

  /** ISO 4217 currency code (e.g. USD, EUR) */
  currency?: string;

  /** One-time cleaning fee charged per stay */
  cleaningFee?: number;

  /** Refundable damage deposit amount */
  refundableDeposit?: number;

  /** Price charged per extra guest per night */
  extraGuestFee?: number;

  /** Discount configuration */
  discounts?: {
    /** Weekly discount multiplier (e.g. 0.9 = 10% off) */
    weekly?: number;

    /** Monthly discount multiplier (e.g. 0.8 = 20% off) */
    monthly?: number;
  };
}

/**
 * Mongoose Schema for Pricing
 * Defines how pricing data is stored in MongoDB.
 *
 * @see IPricing
 * @schema
 * @name PricingSchema
 * @constant {Schema<IPricing>} PricingSchema
 * @memberof IPricing
 */
const PricingSchema = new Schema<IPricing>(
  {
    /** Base nightly price */
    basePrice: { type: Number },

    /** Currency code */
    currency: { type: String },

    /** Cleaning fee */
    cleaningFee: { type: Number },

    /** Refundable damage deposit */
    refundableDeposit: { type: Number },

    /** Extra guest price per night */
    extraGuestFee: { type: Number },

    /** Discount configuration */
    discounts: {
      weekly: { type: Number },
      monthly: { type: Number },
    },
  },
  { _id: false },
);

export { PricingSchema };
export type { IPricing };
