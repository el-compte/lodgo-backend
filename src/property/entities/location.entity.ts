import { Schema } from 'mongoose';

/**
 * Location Interface
 * Represents the physical location of a listing.
 */
interface ILocation {
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  zipcode?: string;
  fullAddress?: string;
  publicAddress?: string;
  floor: Number;
  roomnumber: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

/**
 * Mongoose Schema for Location
 */
const LocationSchema = new Schema<ILocation>(
  {
    addressLine1: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    countryCode: { type: String },
    zipcode: { type: String },
    fullAddress: { type: String },
    publicAddress: { type: String },
    floor: { type: Number },
    roomnumber: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
  },
  { _id: false },
);

export { LocationSchema };
export type { ILocation };
