import { Schema } from 'mongoose';

/**
 * Image Interface
 * Represents an image associated with a listing.
 * Typically synced from a PMS such as Hostaway.
 *
 * @interface
 * @namespace IImage
 */
interface IImage {
  /** External PMS image ID */
  externalId?: number;

  /** Short caption or description of the image */
  caption?: string;

  /** Publicly accessible image URL */
  url: string;

  /** Sort order for displaying images */
  order?: number;
}

/**
 * Mongoose Schema for Image
 * Defines how listing images are stored in MongoDB.
 *
 * @see IImage
 * @schema
 * @name ImageSchema
 * @constant {Schema<IImage>} ImageSchema
 * @memberof IImage
 */
const ImageSchema = new Schema<IImage>(
  {
    /** External PMS image ID */
    externalId: { type: Number },

    /** Image caption or description */
    caption: { type: String },

    /** Public image URL */
    url: { type: String, required: true },

    /** Display order */
    order: { type: Number },
  },
  { _id: false },
);

export { ImageSchema };
export type { IImage };
