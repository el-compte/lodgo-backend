import { Schema } from 'mongoose';

/**
 * Listing PMS (Listing Management System) Configuration Interface
 * Defines the structure for storing PMS configuration details for properties.
 * Each configuration includes the PMS provider, the external property ID,
 * and whether the integration is enabled.
 * @interface
 * @namespace ListingPmsConfig
 * @property {('hostaway' | 'guesty')} provider - The PMS provider name.
 * @property {string} externalListingId - The unique identifier of the property in the PMS.
 * @property {boolean} enabled - Flag indicating if the PMS integration is active.
 */
interface ListingPmsConfig {
  provider: 'hostaway' | 'guesty';
  externalListingId: string;
  enabled: boolean;
  lastSyncedAt?: Date;
}

/**
 * Mongoose Schema for Listing PMS Configuration
 * Defines the schema for storing PMS configuration details in MongoDB.
 * @see ListingPmsConfig
 * @schema
 * @name PmsConfigSchema
 * @constant {Schema<ListingPmsConfig>} PmsConfigSchema
 * @property {('hostaway' | 'guesty')} provider - The PMS provider name.
 * @property {string} externalListingId - The unique identifier of the property in the PMS.
 * @property {boolean} enabled - Flag indicating if the PMS integration is active.
 * @property {Date} [lastSyncedAt] - Timestamp of the last synchronization.
 * @default enabled - true
 * @memberof ListingPmsConfig
 */
const PmsConfigSchema = new Schema<ListingPmsConfig>(
  {
    /** Listing Management System provider */
    provider: { type: String, enum: ['hostaway', 'guesty'], required: true },
    /** Unique identifier of the property in the PMS */
    externalListingId: { type: String, required: true },
    /** Flag indicating if the PMS integration is active */
    enabled: { type: Boolean, default: true },
    /** Timestamp of the last synchronization */
    lastSyncedAt: { type: Date },
  },
  { _id: false },
);

export { PmsConfigSchema };
export type { ListingPmsConfig };
