import { Schema } from 'mongoose';

/**
 * Policies Interface
 * Represents rules and cancellation policies.
 */
interface IPolicies {
  houseRules?: string;
  cancellation?: {
    type?: string;
    ids?: Record<string, number>;
  };
  rentalAgreement?: {
    active?: boolean;
    text?: string;
  };
}

/**
 * Mongoose Schema for Policies
 */
const PoliciesSchema = new Schema<IPolicies>(
  {
    houseRules: { type: String },
    cancellation: {
      type: {
        type: { type: String },
        ids: { type: Map, of: Number },
      },
    },
  rentalAgreement: {
        active: { type: Boolean },
      text: { type: String },
    },
  },
  { _id: false },
);

export { PoliciesSchema };
export type { IPolicies };
