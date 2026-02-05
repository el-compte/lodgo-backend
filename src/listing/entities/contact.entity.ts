import { Schema, Types } from 'mongoose';

/**
 * Contact Interface
 * Represents contact information associated with a listing.
 * May optionally be linked to a user in the system.
 *
 * @interface
 * @namespace IContact
 */
interface IContact {
  /** Optional reference to a user in the system */
  userId?: Types.ObjectId;

  /** First name of the contact person */
  firstName?: string;

  /** Last name of the contact person */
  lastName?: string;

  /** List of contact phone numbers */
  phones?: string[];

  /** Contact email address */
  email?: string;

  /** Preferred language for communication */
  language?: string;

  /** Physical or mailing address of the contact */
  address?: string;
}

/**
 * Mongoose Schema for Contact
 * Defines how contact information is stored in MongoDB.
 *
 * @see IContact
 * @schema
 * @name ContactSchema
 * @constant {Schema<IContact>} ContactSchema
 * @memberof IContact
 */
const ContactSchema = new Schema<IContact>(
  {
    /** Optional reference to a user in the system */
    userId: { type: Schema.Types.ObjectId, ref: 'User' },

    /** First name of the contact person */
    firstName: { type: String },

    /** Last name of the contact person */
    lastName: { type: String },

    /** Contact phone numbers */
    phones: { type: [String], default: [] },

    /** Contact email address */
    email: { type: String },

    /** Preferred language */
    language: { type: String },

    /** Contact address */
    address: { type: String },
  },
  { _id: false },
);

export { ContactSchema };
export type { IContact };
