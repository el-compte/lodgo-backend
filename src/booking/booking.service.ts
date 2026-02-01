import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Booking,
  BookingDocument,
  ReservationStatus,
} from './entities/booking.entity';
import {
  TimeBlock,
  TimeBlockDocument,
  ConflictType,
  TimeBlockStatus,
  PriorityLevel,
} from './entities/timeblock.entity';

/**
 * Input DTO for creating a booking
 */
export interface CreateBookingInput {
  externalReservationId: string;
  propertyId: string;
  provider: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  checkInDate: Date;
  checkOutDate: Date;
  numberOfGuests: number;
  totalPrice?: number;
  currency?: string;
  status?: string;
}

/**
 * Response from booking creation
 */
export interface CreateBookingResponse {
  booking: BookingDocument;
  hasConflict: boolean;
  timeBlock?: TimeBlockDocument;
}

/**
 * Booking Service
 * Handles all booking operations including creation, updates, cancellation,
 * and time-blocking for conflict detection
 */
@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectModel('Booking')
    private readonly bookingModel: Model<BookingDocument>,
    @InjectModel('TimeBlock')
    private readonly timeBlockModel: Model<TimeBlockDocument>,
  ) {}

  /**
   * Create a new booking with time-blocking check
   * Implements conflict detection algorithm from TIME-BLOCKING-ALGORITHM.md
   * If a booking with the same externalReservationId and provider exists, it will be updated instead
   *
   * @param bookingData - Booking creation input
   * @returns Object with booking, conflict status, and optional time block
   * @throws BadRequestException if required fields are missing
   */
  async createBooking(
    bookingData: CreateBookingInput,
  ): Promise<CreateBookingResponse> {
    // Validate required fields
    if (
      !bookingData.externalReservationId ||
      !bookingData.propertyId ||
      !bookingData.guestName
    ) {
      throw new BadRequestException('Missing required booking fields');
    }

    // Step 0: Check if booking with same externalReservationId and provider already exists
    const existingBooking = await this.bookingModel.findOne({
      externalReservationId: bookingData.externalReservationId,
      provider: bookingData.provider,
    });

    // Step 1: Calculate nights
    const numberOfNights = this.calculateNights(
      bookingData.checkInDate,
      bookingData.checkOutDate,
    );

    // Step 2: Check for conflicting reservations
    // If updating existing booking, exclude it from conflict check
    const conflicts = await this.findConflictingReservations(
      bookingData.propertyId,
      bookingData.checkInDate,
      bookingData.checkOutDate,
      existingBooking?._id.toString(),
    );

    // Step 3: Create or update booking
    const bookingPayload: Partial<Booking> = {
      ...bookingData,
      propertyId: new Types.ObjectId(bookingData.propertyId),
      numberOfNights,
      reservationStatus:
        conflicts.length > 0
          ? ReservationStatus.PENDING_REVIEW
          : ReservationStatus.CONFIRMED,
    };

    let booking: BookingDocument;

    if (existingBooking) {
      // Update existing booking
      Object.assign(existingBooking, bookingPayload);
      booking = await existingBooking.save();

      this.logger.log({
        message: 'Booking updated',
        bookingId: booking._id,
        externalReservationId: booking.externalReservationId,
        propertyId: booking.propertyId,
      });
    } else {
      // Create new booking
      const newBooking = new this.bookingModel(bookingPayload);
      booking = await newBooking.save();

      this.logger.log({
        message: 'Booking created',
        bookingId: booking._id,
        externalReservationId: booking.externalReservationId,
        propertyId: booking.propertyId,
      });
    }

    // Step 4: If conflicts found, create time block
    if (conflicts.length > 0) {
      const timeBlock = await this.createTimeBlock(booking, conflicts);
      booking.timeBlockId = timeBlock._id;
      await booking.save();

      this.logger.warn({
        message: 'Booking conflict detected',
        bookingId: booking._id,
        externalReservationId: booking.externalReservationId,
        conflictCount: conflicts.length,
        timeBlockId: timeBlock._id,
      });

      return { booking, hasConflict: true, timeBlock };
    }

    return { booking, hasConflict: false };
  }

  /**
   * Find conflicting reservations for given dates
   * Queries for bookings that overlap with the provided date range
   *
   * @param propertyId - Property ID to check
   * @param checkIn - Check-in date
   * @param checkOut - Check-out date
   * @param excludeId - Optional booking ObjectId to exclude from results
   * @returns Array of conflicting bookings
   */
  private async findConflictingReservations(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
    excludeId?: string,
  ): Promise<BookingDocument[]> {
    const query: Record<string, any> = {
      propertyId: new Types.ObjectId(propertyId),
      reservationStatus: { $ne: ReservationStatus.CANCELLED },
      $expr: {
        $and: [
          { $lt: ['$checkInDate', checkOut] },
          { $gt: ['$checkOutDate', checkIn] },
        ],
      },
    };

    if (excludeId) {
      query._id = { $ne: new Types.ObjectId(excludeId) };
    }

    return this.bookingModel.find(query).exec();
  }

  /**
   * Create a time block for conflicting reservations
   * Records the conflict and marks bookings as pending review
   *
   * @param primaryBooking - The new booking causing the conflict
   * @param conflicts - Array of conflicting existing bookings
   * @returns Created time block document
   */
  private async createTimeBlock(
    primaryBooking: BookingDocument,
    conflicts: BookingDocument[],
  ): Promise<TimeBlockDocument> {
    // Determine conflict type based on first conflict
    const conflictType = this.classifyConflict(
      conflicts[0].checkInDate,
      conflicts[0].checkOutDate,
      primaryBooking.checkInDate,
      primaryBooking.checkOutDate,
    );

    // Calculate overlap days
    const overlapDays = this.calculateOverlapDays(
      conflicts[0].checkInDate,
      conflicts[0].checkOutDate,
      primaryBooking.checkInDate,
      primaryBooking.checkOutDate,
    );

    // Determine priority based on conflict severity
    const priority = this.determinePriority(conflicts.length, overlapDays);

    // Build time block
    const timeBlockPayload: Partial<TimeBlock> = {
      propertyId: primaryBooking.propertyId,
      blockType: 'RESERVATION_BLOCK',
      checkInDate: primaryBooking.checkInDate,
      checkOutDate: primaryBooking.checkOutDate,
      numberOfNights: primaryBooking.numberOfNights,
      reservationIds: [
        primaryBooking.externalReservationId,
        ...conflicts.map((c) => c.externalReservationId),
      ],
      primaryReservationId: primaryBooking.externalReservationId,
      conflictingReservationIds: conflicts.map((c) => c.externalReservationId),
      conflictType,
      overlapDays,
      status: TimeBlockStatus.PENDING_REVIEW,
      priority,
      provider: primaryBooking.provider,
      guestName: primaryBooking.guestName,
      createdBy: 'system',
    };

    const timeBlock = new this.timeBlockModel(timeBlockPayload);
    return timeBlock.save();
  }

  /**
   * Classify the type of conflict between two date ranges
   * Implements conflict classification from TIME-BLOCKING-ALGORITHM.md
   *
   * @param existingCheckIn - Existing reservation check-in
   * @param existingCheckOut - Existing reservation check-out
   * @param newCheckIn - New reservation check-in
   * @param newCheckOut - New reservation check-out
   * @returns Conflict type classification
   */
  private classifyConflict(
    existingCheckIn: Date,
    existingCheckOut: Date,
    newCheckIn: Date,
    newCheckOut: Date,
  ): ConflictType {
    const existingStart = existingCheckIn.getTime();
    const existingEnd = existingCheckOut.getTime();
    const newStart = newCheckIn.getTime();
    const newEnd = newCheckOut.getTime();

    // Check for exact overlap (same dates)
    if (existingStart === newStart && existingEnd === newEnd) {
      return ConflictType.EXACT_OVERLAP;
    }

    // Check for complete overlap (new booking completely covers existing)
    if (newStart <= existingStart && newEnd >= existingEnd) {
      return ConflictType.COMPLETE_OVERLAP;
    }

    // Check for partial overlap
    if (
      (newStart < existingEnd && newStart >= existingStart) ||
      (newEnd > existingStart && newEnd <= existingEnd)
    ) {
      return ConflictType.PARTIAL_OVERLAP;
    }

    // Adjacent dates
    return ConflictType.ADJACENT;
  }

  /**
   * Calculate the number of overlapping days between two date ranges
   *
   * @param existingStart - Start of existing range
   * @param existingEnd - End of existing range
   * @param newStart - Start of new range
   * @param newEnd - End of new range
   * @returns Number of overlapping days
   */
  private calculateOverlapDays(
    existingStart: Date,
    existingEnd: Date,
    newStart: Date,
    newEnd: Date,
  ): number {
    const overlapStart = Math.max(existingStart.getTime(), newStart.getTime());
    const overlapEnd = Math.min(existingEnd.getTime(), newEnd.getTime());

    if (overlapStart >= overlapEnd) {
      return 0;
    }

    const overlapMs = overlapEnd - overlapStart;
    return Math.ceil(overlapMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine priority level based on conflict severity
   * Priority increases with number of conflicts and overlap duration
   *
   * @param conflictCount - Number of conflicting reservations
   * @param overlapDays - Number of overlapping days
   * @returns Priority level
   */
  private determinePriority(
    conflictCount: number,
    overlapDays: number,
  ): PriorityLevel {
    if (conflictCount > 2 || overlapDays > 7) {
      return PriorityLevel.CRITICAL;
    }
    if (conflictCount > 1 || overlapDays > 3) {
      return PriorityLevel.HIGH;
    }
    if (overlapDays > 1) {
      return PriorityLevel.MEDIUM;
    }
    return PriorityLevel.LOW;
  }

  /**
   * Calculate the number of nights between check-in and check-out
   *
   * @param checkIn - Check-in date
   * @param checkOut - Check-out date
   * @returns Number of nights
   */
  private calculateNights(checkIn: Date, checkOut: Date): number {
    const diffMs = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Find a booking by external reservation ID and provider
   *
   * @param provider - PMS provider name
   * @param externalReservationId - External reservation ID
   * @returns Booking document or null if not found
   */
  async findByExternalReservationId(
    provider: string,
    externalReservationId: string,
  ): Promise<BookingDocument | null> {
    return this.bookingModel
      .findOne({ provider, externalReservationId })
      .exec();
  }

  /**
   * Find a booking by ID
   *
   * @param bookingId - MongoDB booking ID
   * @returns Booking document
   * @throws NotFoundException if booking not found
   */
  async findById(bookingId: string): Promise<BookingDocument> {
    const booking = await this.bookingModel.findById(bookingId).exec();
    if (!booking) {
      throw new NotFoundException(`Booking ${bookingId} not found`);
    }
    return booking;
  }

  /**
   * Find all bookings for a property within a date range
   *
   * @param propertyId - Property ID
   * @param checkIn - Start date
   * @param checkOut - End date
   * @returns Array of bookings
   */
  async findByPropertyAndDates(
    propertyId: string,
    checkIn: Date,
    checkOut: Date,
  ): Promise<BookingDocument[]> {
    return this.bookingModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        $expr: {
          $and: [
            { $lt: ['$checkInDate', checkOut] },
            { $gt: ['$checkOutDate', checkIn] },
          ],
        },
      })
      .exec();
  }

  /**
   * Update a booking with conflict re-validation
   * If dates change, re-checks for conflicts
   *
   * @param externalReservationId - External reservation ID
   * @param updates - Partial booking updates
   * @returns Updated booking document
   * @throws NotFoundException if booking not found
   */
  async updateBooking(
    externalReservationId: string,
    updates: Partial<Booking>,
  ): Promise<BookingDocument> {
    const booking = await this.findByExternalReservationId(
      'hostaway',
      externalReservationId,
    );

    if (!booking) {
      throw new NotFoundException(`Booking ${externalReservationId} not found`);
    }

    // If dates changed, re-check for conflicts
    if (updates.checkInDate || updates.checkOutDate) {
      const newCheckIn = updates.checkInDate || booking.checkInDate;
      const newCheckOut = updates.checkOutDate || booking.checkOutDate;

      const conflicts = await this.findConflictingReservations(
        booking.propertyId.toString(),
        newCheckIn,
        newCheckOut,
        externalReservationId,
      );

      if (conflicts.length > 0) {
        updates.reservationStatus = ReservationStatus.PENDING_REVIEW;

        this.logger.warn({
          message: 'Booking update caused conflicts',
          externalReservationId,
          conflictCount: conflicts.length,
        });
      }
    }

    // Apply updates
    Object.assign(booking, updates);
    await booking.save();

    this.logger.log({
      message: 'Booking updated',
      externalReservationId,
      updatedFields: Object.keys(updates),
    });

    return booking;
  }

  /**
   * Cancel a booking
   * Updates status and resolves any associated time blocks
   *
   * @param externalReservationId - External reservation ID
   * @param cancelReason - Optional reason for cancellation
   * @returns Cancelled booking document
   * @throws NotFoundException if booking not found
   */
  async cancelBooking(
    externalReservationId: string,
    cancelReason?: string,
  ): Promise<BookingDocument> {
    const booking = await this.findByExternalReservationId(
      'hostaway',
      externalReservationId,
    );

    if (!booking) {
      throw new NotFoundException(`Booking ${externalReservationId} not found`);
    }

    // Update booking status
    booking.reservationStatus = ReservationStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelReason = cancelReason;
    await booking.save();

    // Resolve associated time blocks
    if (booking.timeBlockId) {
      await this.timeBlockModel.findByIdAndUpdate(booking.timeBlockId, {
        status: TimeBlockStatus.RESOLVED,
        resolvedAt: new Date(),
        resolutionNotes: `Booking ${externalReservationId} cancelled. Reason: ${cancelReason || 'No reason provided'}`,
      });
    }

    this.logger.log({
      message: 'Booking cancelled',
      externalReservationId,
      cancelReason,
      cancelledAt: booking.cancelledAt,
    });

    return booking;
  }

  /**
   * Get all active bookings for a property
   *
   * @param propertyId - Property ID
   * @returns Array of active bookings
   */
  async getActiveBookings(propertyId: string): Promise<BookingDocument[]> {
    return this.bookingModel
      .find({
        propertyId: new Types.ObjectId(propertyId),
        reservationStatus: { $ne: ReservationStatus.CANCELLED },
      })
      .sort({ checkInDate: 1 })
      .exec();
  }

  /**
   * Get time blocks for a property
   *
   * @param propertyId - Property ID
   * @param status - Optional status filter
   * @returns Array of time blocks
   */
  async getTimeBlocks(
    propertyId: string,
    status?: TimeBlockStatus,
  ): Promise<TimeBlockDocument[]> {
    const query: Record<string, any> = {
      propertyId: new Types.ObjectId(propertyId),
    };

    if (status) {
      query.status = status;
    }

    return this.timeBlockModel
      .find(query)
      .sort({ priority: -1, createdAt: -1 })
      .exec();
  }
}
