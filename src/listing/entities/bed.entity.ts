import { Schema } from 'mongoose';

/**
 * Bed Interface
 * Represents a bed configuration within a listing.
 * Typically synced from a PMS such as Hostaway.
 *
 * @interface
 * @namespace IBed
 */
interface IBed {
  /** External PMS bed type identifier */
  bedTypeId: number;

  /** Number of beds of this type */
  quantity: number;
}

/**
 * Mongoose Schema for Bed
 * Defines how bed configurations are stored in MongoDB.
 *
 * @see IBed
 * @schema
 * @name BedSchema
 * @constant {Schema<IBed>} BedSchema
 * @memberof IBed
 */
const BedSchema = new Schema<IBed>(
  {
    /** External PMS bed type identifier */
    bedTypeId: { type: Number, required: true },

    /** Number of beds of this type */
    quantity: { type: Number, required: true },
  },
  { _id: false },
);

export { BedSchema };
export type { IBed };
