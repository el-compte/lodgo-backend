import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type TimeBlockDocument = TimeBlock & Document;

/**
 * Time Block Status enum
 * Tracks the state of a blocked time period
 */
export enum TimeBlockStatus {
  ACTIVE = 'ACTIVE',
  PENDING_REVIEW = 'PENDING_REVIEW',
  RESOLVED = 'RESOLVED',
  EXPIRED = 'EXPIRED',
}

/**
 * Conflict Type enum
 * Classifies the type of overlap between reservations
 */
export enum ConflictType {
  EXACT_OVERLAP = 'EXACT_OVERLAP', // Same check-in and check-out dates
  PARTIAL_OVERLAP = 'PARTIAL_OVERLAP', // Overlapping dates but not exact
  COMPLETE_OVERLAP = 'COMPLETE_OVERLAP', // New booking completely covers existing
  ADJACENT = 'ADJACENT', // Adjacent dates (e.g., one ends when other starts)
}

/**
 * Priority Level enum
 * Determines urgency of conflict resolution
 */
export enum PriorityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * TimeBlock Entity
 * Represents a blocked time period for a property, typically due to booking conflicts
 * Used for duplicate detection and conflict resolution workflow
 */
@Schema({ timestamps: true })
export class TimeBlock {
  /** Property Reference */

  /**
   * Reference to the Property this time block belongs to
   */
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Property',
    required: true,
    index: true,
  })
  propertyId: Types.ObjectId;

  /**
   * Type of block: reservation conflict, manual block, or maintenance
   */
  @Prop({
    required: true,
    enum: ['RESERVATION_BLOCK', 'MANUAL_BLOCK', 'MAINTENANCE'],
    default: 'RESERVATION_BLOCK',
  })
  blockType: string;

  /** Date Range */

  /**
   * Check-in date of the blocked period
   */
  @Prop({ required: true, type: Date, index: true })
  checkInDate: Date;

  /**
   * Check-out date of the blocked period
   */
  @Prop({ required: true, type: Date, index: true })
  checkOutDate: Date;

  /**
   * Number of nights in the blocked period
   */
  @Prop({ required: true, min: 1 })
  numberOfNights: number;

  /** Reservation References */

  /**
   * List of all external reservation IDs involved in this conflict
   */
  @Prop({ type: [String], default: [] })
  reservationIds: string[];

  /**
   * The primary reservation ID that triggered the conflict detection
   */
  @Prop()
  primaryReservationId?: string;

  /**
   * List of external reservation IDs that conflict with the primary one
   */
  @Prop({ type: [String], default: [] })
  conflictingReservationIds: string[];

  /** Conflict Classification */

  /**
   * Type of conflict detected
   */
  @Prop({
    enum: Object.values(ConflictType),
    required: true,
  })
  conflictType: ConflictType;

  /**
   * Number of overlapping days between conflicting reservations
   */
  @Prop({ default: 0, min: 0 })
  overlapDays: number;

  /** Status & Priority */

  /**
   * Current status of this time block
   */
  @Prop({
    required: true,
    enum: Object.values(TimeBlockStatus),
    default: TimeBlockStatus.PENDING_REVIEW,
    index: true,
  })
  status: TimeBlockStatus;

  /**
   * Priority level for resolution
   */
  @Prop({
    required: true,
    enum: Object.values(PriorityLevel),
    default: PriorityLevel.MEDIUM,
  })
  priority: PriorityLevel;

  /** Additional Information */

  /**
   * PMS provider name
   */
  @Prop({ required: true })
  provider: string;

  /**
   * Guest name from the primary reservation
   */
  @Prop({ required: true })
  guestName: string;

  /**
   * Additional notes about the conflict
   */
  @Prop()
  notes?: string;

  /** Audit & Resolution  */

  /**
   * User or system that created this time block
   */
  @Prop({ default: 'system' })
  createdBy: string;

  /**
   * Timestamp when the conflict was resolved
   */
  @Prop({ type: Date })
  resolvedAt?: Date;

  /**
   * User or system that resolved this conflict
   */
  @Prop()
  resolvedBy?: string;

  /**
   * Notes on how the conflict was resolved
   */
  @Prop()
  resolutionNotes?: string;
}

export const TimeBlockSchema = SchemaFactory.createForClass(TimeBlock);

/**
 * Index for finding active time blocks for a property
 * Used to check for existing conflicts
 */
TimeBlockSchema.index({ propertyId: 1, status: 1 });

/**
 * Index for date range queries
 * Used to find blocks within a specific date range
 */
TimeBlockSchema.index({ checkInDate: 1, checkOutDate: 1 });

/**
 * Index for pending review blocks
 * Used to show admin dashboard of unresolved conflicts
 */
TimeBlockSchema.index({ status: 1, priority: -1 });
