import { Schema } from 'mongoose';

/**
 * Property PMS (Property Management System) Configuration Interface
 * Defines the structure for storing PMS configuration details for properties.
 * Each configuration includes the PMS provider, the external property ID,
 * and whether the integration is enabled.
 * @interface
 * @namespace PropertyPmsConfig
 * @property {('hostaway' | 'guesty')} provider - The PMS provider name.
 * @property {string} externalPropertyId - The unique identifier of the property in the PMS.
 * @property {boolean} enabled - Flag indicating if the PMS integration is active.
 */
interface PropertyPmsConfig {
  provider: 'hostaway' | 'guesty';
  externalPropertyId: string;
  enabled: boolean;
}

/**
 * Mongoose Schema for Property PMS Configuration
 * Defines the schema for storing PMS configuration details in MongoDB.
 * @see PropertyPmsConfig
 * @schema
 * @name PmsConfigSchema
 * @constant {Schema<PropertyPmsConfig>} PmsConfigSchema
 * @property {('hostaway' | 'guesty')} provider - The PMS provider name.
 * @property {string} externalPropertyId - The unique identifier of the property in the PMS.
 * @property {boolean} enabled - Flag indicating if the PMS integration is active.
 * @default enabled - true
 * @memberof PropertyPmsConfig
 */
const PmsConfigSchema = new Schema<PropertyPmsConfig>(
  {
    /** Property Management System provider */
    provider: { type: String, enum: ['hostaway', 'guesty'], required: true },
    /** Unique identifier of the property in the PMS */
    externalPropertyId: { type: String, required: true },
    /** Flag indicating if the PMS integration is active */
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
);

export { PmsConfigSchema };
export type { PropertyPmsConfig };
