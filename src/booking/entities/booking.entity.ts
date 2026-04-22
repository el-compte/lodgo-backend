import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type BookingDocument = Booking & Document;

/**
 * Booking/Reservation status enum
 */
export enum ReservationStatus {
  CONFIRMED = 'CONFIRMED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  PENDING_REVIEW = 'PENDING_REVIEW',
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PAID = 'PAID',
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
}

/**
 * Booking/Reservation Entity
 * Represents a booking from PMS (Property Management System) like Hostaway
 */
@Schema({ timestamps: true })
export class Booking {
  /** Identification */

  /**
   * External reservation ID from the PMS provider (e.g., Hostaway reservationId)
   * Must be unique per provider
   */
  @Prop({ required: true, index: true })
  externalReservationId: string;

  /**
   * Reference to the Property in our system
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true,
  })
  propertyId: Types.ObjectId;

  /**
   * PMS provider name (e.g., 'hostaway', 'guesty')
   */
  @Prop({ required: true, enum: ['hostaway', 'guesty'], default: 'hostaway' })
  provider: string;

  /** Guest Information */

  /**
   * Guest full name
   */
  @Prop({ required: true })
  guestName: string;

  /**
   * Guest email address
   */
  @Prop()
  guestEmail?: string;

  /**
   * Guest phone number
   */
  @Prop()
  guestPhone?: string;

  /** Dates */

  /**
   * Check-in date (arrival date)
   */
  @Prop({ required: true, type: Date, index: true })
  checkInDate: Date;

  /**
   * Check-out date (departure date)
   */
  @Prop({ required: true, type: Date, index: true })
  checkOutDate: Date;

  /**
   * Number of nights for this booking
   * Calculated as (checkOutDate - checkInDate) in days
   */
  @Prop({ required: true, min: 1 })
  numberOfNights: number;

  /** Occupancy */

  /**
   * Number of guests staying
   */
  @Prop({ required: true, min: 1, default: 1 })
  numberOfGuests: number;

  /** Pricing */

  /**
   * Total price for the booking
   */
  @Prop({ min: 0 })
  totalPrice?: number;

  /**
   * Currency code (e.g., 'USD', 'EUR')
   */
  @Prop()
  currency?: string;

  /** Status */

  /**
   * Current status of the reservation
   * - CONFIRMED: Booking is confirmed and active
   * - PENDING: Booking is awaiting confirmation
   * - CANCELLED: Booking has been cancelled
   * - PENDING_REVIEW: Booking has conflicts and needs review
   */
  @Prop({
    required: true,
    enum: Object.values(ReservationStatus),
    default: ReservationStatus.CONFIRMED,
  })
  reservationStatus: ReservationStatus;

  /**
   * Payment status for this booking
   */
  @Prop({ enum: Object.values(PaymentStatus) })
  paymentStatus?: PaymentStatus;

  /** Time-Blocking */

  /**
   * Reference to TimeBlock if this booking has date conflicts
   * Used for duplicate detection and conflict resolution
   */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'TimeBlock' })
  timeBlockId?: Types.ObjectId;

  /** Additional Information */
  /**
   * Additional notes or special requests
   */
  @Prop()
  notes?: string;

  /** Audit & Cancellation */

  /**
   * Timestamp when the booking was cancelled
   */
  @Prop({ type: Date })
  cancelledAt?: Date;

  /**
   * Reason for cancellation
   */
  @Prop()
  cancelReason?: string;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

/**
 * Compound index for date range queries on property
 * Used to find bookings for a specific property within a date range
 */
BookingSchema.index({ propertyId: 1, checkInDate: 1, checkOutDate: 1 });

/**
 * Unique compound index for external reservation ID per provider
 * Prevents duplicate bookings from the same PMS
 */
BookingSchema.index(
  { externalReservationId: 1, provider: 1 },
  { unique: true },
);

/**
 * Index for filtering by reservation status
 * Used to find active, cancelled, or pending bookings
 */
BookingSchema.index({ reservationStatus: 1 });

/**
 * Index for date range queries (conflict detection)
 * Used by the time-blocking algorithm to find overlapping reservations
 */
BookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
