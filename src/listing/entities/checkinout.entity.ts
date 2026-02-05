import { Schema } from 'mongoose';

/**
 * CheckInOut Interface
 * Represents check-in and check-out configuration for a listing.
 *
 * @interface
 * @namespace ICheckInOut
 */
interface ICheckInOut {
  /** Earliest allowed check-in time (hour in 24h format, PMS-based) */
  checkInStart?: number;

  /** Latest allowed check-in time (hour in 24h format, PMS-based) */
  checkInEnd?: number;

  /** Required check-out time (hour in 24h format, PMS-based) */
  checkOutTime?: number;

  /** Instructions for guest check-in */
  instructions?: string;

  /** Key pickup instructions */
  keyPickup?: string;

  /** Door or smart-lock security code */
  doorCode?: string;
}

/**
 * Mongoose Schema for CheckInOut
 * Defines check-in and check-out rules for a listing.
 *
 * @see ICheckInOut
 * @schema
 * @name CheckInOutSchema
 * @constant {Schema<ICheckInOut>} CheckInOutSchema
 * @memberof ICheckInOut
 */
const CheckInOutSchema = new Schema<ICheckInOut>(
  {
    /** Earliest allowed check-in time */
    checkInStart: { type: Number },

    /** Latest allowed check-in time */
    checkInEnd: { type: Number },

    /** Required check-out time */
    checkOutTime: { type: Number },

    /** Instructions for guest check-in */
    instructions: { type: String },

    /** Key pickup instructions */
    keyPickup: { type: String },

    /** Door or smart-lock security code */
    doorCode: { type: String },
  },
  { _id: false },
);

export { CheckInOutSchema };
export type { ICheckInOut };
