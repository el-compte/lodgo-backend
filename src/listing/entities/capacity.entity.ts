import { Schema } from 'mongoose';

/**
 * Capacity Interface
 * Defines guest and room capacity.
 */
interface ICapacity {
  guests?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  squareMeters?: number;
}

/**
 * Mongoose Schema for Capacity
 */
const CapacitySchema = new Schema<ICapacity>(
  {
    guests: { type: Number },
    bedrooms: { type: Number },
    beds: { type: Number },
    bathrooms: { type: Number },
    squareMeters: { type: Number },
  },
  { _id: false },
);

export { CapacitySchema };
export type { ICapacity };
