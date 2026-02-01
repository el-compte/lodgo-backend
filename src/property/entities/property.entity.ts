import { Document, Schema } from 'mongoose';
import { PropertyPmsConfig, PmsConfigSchema } from './pms-config.entity';

/**
 * Property Interface
 * Represents a property entity with its details and PMS configurations.
 * @interface
 * @namespace IProperty
 * @property {string} name - The name of the property.
 * @property {string} [address] - The address of the property.
 * @property {PropertyPmsConfig[]} pmsConfigs - Array of PMS configurations associated with the property.
 */
interface IProperty extends Document {
  /** The name of the property */
  name: string;
  /** The address of the property */
  address?: string;
  /** Array of PMS configurations associated with the property */
  pmsConfigs: PropertyPmsConfig[];
}

/**
 * Mongoose Schema for Property
 * Defines the schema for storing property details in MongoDB.
 * @see IProperty
 * @schema
 * @name PropertySchema
 * @constant {Schema<IProperty>} PropertySchema
 * @property {string} name - The name of the property.
 * @property {string} [address] - The address of the property.
 * @property {PropertyPmsConfig[]} pmsConfigs - Array of PMS configurations associated with the property.
 * @memberof IProperty
 */
const PropertySchema = new Schema<IProperty>(
  {
    /** The name of the property */
    name: { type: String, required: true },
    /** The address of the property */
    address: { type: String },
    /** Array of PMS configurations associated with the property */
    pmsConfigs: { type: [PmsConfigSchema], default: [] },
  },
  { timestamps: true },
);

export { PropertySchema };
export type { IProperty };
