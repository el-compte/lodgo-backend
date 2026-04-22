import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  BookingDocument,
  ReservationStatus,
} from '../src/booking/entities/booking.entity';
import {
  TimeBlockDocument,
  ConflictType,
} from '../src/booking/entities/timeblock.entity';
import { IProperty } from '../src/property/entities/property.entity';
import {
  BookingService,
  CreateBookingResponse,
} from '../src/booking/booking.service';

describe('Booking E2E Tests', () => {
  let app: INestApplication;
  let bookingModel: Model<BookingDocument>;
  let timeBlockModel: Model<TimeBlockDocument>;
  let propertyModel: Model<IProperty>;
  let bookingService: BookingService;

  // Test data storage
  let createdPropertyId: string;
  const createdBookingIds: string[] = [];
  const createdTimeBlockIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    bookingModel = moduleFixture.get<Model<BookingDocument>>(
      getModelToken('Booking'),
    );
    timeBlockModel = moduleFixture.get<Model<TimeBlockDocument>>(
      getModelToken('TimeBlock'),
    );
    propertyModel = moduleFixture.get<Model<IProperty>>(
      getModelToken('Property'),
    );
    bookingService = moduleFixture.get<BookingService>(BookingService);
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdBookingIds.length > 0) {
      await bookingModel.deleteMany({ _id: { $in: createdBookingIds } });
    }
    if (createdTimeBlockIds.length > 0) {
      await timeBlockModel.deleteMany({ _id: { $in: createdTimeBlockIds } });
    }
    if (createdPropertyId) {
      await propertyModel.findByIdAndDelete(createdPropertyId);
    }
    await app.close();
  });

  beforeEach(async () => {
    // Create a test property for each test
    const property = await propertyModel.create({
      name: 'E2E Test Property',
      address: '123 Test Street',
      pmsConfigs: [
        {
          provider: 'hostaway',
          externalPropertyId: `e2e-hostaway-${Date.now()}`,
          enabled: true,
        },
      ],
    });
    createdPropertyId = property._id.toString();
  });

  describe('Booking Creation Flow', () => {
    it('should create a booking with confirmed status when no conflicts exist', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 5);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 3);

      const result = await bookingService.createBooking({
        externalReservationId: `res-${Date.now()}`,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 2,
        totalPrice: 450,
      });

      expect(result).toBeDefined();
      expect(result.booking).toBeDefined();
      expect(result.booking.guestName).toBe('John Doe');
      expect(result.booking.guestEmail).toBe('john@example.com');
      expect(result.booking.reservationStatus).toBe(
        ReservationStatus.CONFIRMED,
      );
      expect(result.booking.totalPrice).toBe(450);
      expect(result.hasConflict).toBe(false);

      createdBookingIds.push(result.booking._id.toString());
    });

    it('should create a booking with pending_review status when conflicts exist', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 10);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      // Create first booking
      const firstResult = await bookingService.createBooking({
        externalReservationId: `res-1-${Date.now()}`,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest One',
        guestEmail: 'guest1@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 2,
        totalPrice: 300,
      });
      expect(firstResult.booking.reservationStatus).toBe(
        ReservationStatus.CONFIRMED,
      );
      expect(firstResult.hasConflict).toBe(false);
      createdBookingIds.push(firstResult.booking._id.toString());

      // Create overlapping booking
      const secondCheckIn = new Date(checkInDate);
      secondCheckIn.setDate(secondCheckIn.getDate() + 1);
      const secondCheckOut = new Date(checkOutDate);
      secondCheckOut.setDate(secondCheckOut.getDate() + 1);

      const secondResult = await bookingService.createBooking({
        externalReservationId: `res-2-${Date.now()}`,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest Two',
        guestEmail: 'guest2@example.com',
        checkInDate: secondCheckIn,
        checkOutDate: secondCheckOut,
        numberOfGuests: 2,
        totalPrice: 300,
      });

      // Should be in PENDING_REVIEW due to conflict
      expect(secondResult.booking.reservationStatus).toBe(
        ReservationStatus.PENDING_REVIEW,
      );
      expect(secondResult.hasConflict).toBe(true);
      expect(secondResult.timeBlock).toBeDefined();
      expect([
        ConflictType.EXACT_OVERLAP,
        ConflictType.PARTIAL_OVERLAP,
        ConflictType.COMPLETE_OVERLAP,
      ]).toContain(secondResult.timeBlock?.conflictType);

      createdBookingIds.push(secondResult.booking._id.toString());
      if (secondResult.timeBlock) {
        createdTimeBlockIds.push(secondResult.timeBlock._id.toString());
      }
    });

    it('should handle duplicate reservation (same externalReservationId) by updating', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 15);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const externalResId = `res-dup-${Date.now()}`;

      // Create first time
      const firstResult = await bookingService.createBooking({
        externalReservationId: externalResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Duplicate Guest',
        guestEmail: 'dup@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 300,
      });
      const firstId = firstResult.booking._id.toString();

      // Create with same external ID should update the existing one
      const secondResult = await bookingService.createBooking({
        externalReservationId: externalResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Duplicate Guest Updated',
        guestEmail: 'dup.updated@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 2,
        totalPrice: 350,
      });

      // Should be the same booking (updated, not created twice)
      expect(secondResult.booking._id.toString()).toBe(firstId);
      expect(secondResult.booking.guestName).toBe('Duplicate Guest Updated');

      const allBookingsWithId = await bookingModel.find({
        externalReservationId: externalResId,
      });
      expect(allBookingsWithId).toHaveLength(1);

      createdBookingIds.push(firstId);
    });
  });

  describe('Booking Cancellation Flow', () => {
    it('should cancel a booking and set status to cancelled', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 20);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 3);

      const externalResId = `res-cancel-${Date.now()}`;
      const createdResult = await bookingService.createBooking({
        externalReservationId: externalResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Cancellable Guest',
        guestEmail: 'cancel@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 450,
      });
      expect(createdResult.booking.reservationStatus).toBe(
        ReservationStatus.CONFIRMED,
      );

      // Now cancel it
      const cancelledBooking = await bookingService.cancelBooking(
        externalResId,
        'Guest requested cancellation',
      );

      // Verify booking status changed to CANCELLED
      expect(cancelledBooking.reservationStatus).toBe(
        ReservationStatus.CANCELLED,
      );

      createdBookingIds.push(createdResult.booking._id.toString());
    });

    it('should remove time blocks when conflicting booking is cancelled', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 25);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 3);

      // First booking
      const firstResId = `res-first-${Date.now()}`;
      const firstResult = await bookingService.createBooking({
        externalReservationId: firstResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'First Guest',
        guestEmail: 'first@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 450,
      });

      // Second overlapping booking
      const secondCheckIn = new Date(checkInDate);
      secondCheckIn.setDate(secondCheckIn.getDate() + 1);
      const secondCheckOut = new Date(checkOutDate);
      secondCheckOut.setDate(secondCheckOut.getDate() + 1);

      const secondResId = `res-second-${Date.now()}`;
      const secondResult = await bookingService.createBooking({
        externalReservationId: secondResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Second Guest',
        guestEmail: 'second@example.com',
        checkInDate: secondCheckIn,
        checkOutDate: secondCheckOut,
        numberOfGuests: 1,
        totalPrice: 450,
      });

      // Verify second booking is in PENDING_REVIEW due to conflict
      expect(secondResult.booking.reservationStatus).toBe(
        ReservationStatus.PENDING_REVIEW,
      );

      // Get time blocks created
      const timeBlocksBefore = await timeBlockModel.find({
        primaryReservationId: secondResult.booking.externalReservationId,
      });
      expect(timeBlocksBefore.length).toBeGreaterThan(0);

      // Cancel the second booking
      await bookingService.cancelBooking(secondResId, 'Test cancellation');

      // Verify time blocks are cleaned up
      const timeBlocksAfter = await timeBlockModel.find({
        primaryReservationId: secondResult.booking.externalReservationId,
        status: { $ne: 'RESOLVED' },
      });
      expect(timeBlocksAfter.length).toBe(0);

      createdBookingIds.push(
        firstResult.booking._id.toString(),
        secondResult.booking._id.toString(),
      );
      createdTimeBlockIds.push(
        ...timeBlocksBefore.map((tb) => tb._id.toString()),
      );
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect exact duplicate bookings (same dates)', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 30);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 4);

      // First booking
      const firstResId = `res-exact-dup-1-${Date.now()}`;
      const firstResult = await bookingService.createBooking({
        externalReservationId: firstResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Duplicate Guest',
        guestEmail: 'dup@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 2,
        totalPrice: 600,
      });

      // Second booking with same dates but different reservation ID
      const secondResId = `res-exact-dup-2-${Date.now()}`;
      const secondResult = await bookingService.createBooking({
        externalReservationId: secondResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Another Guest',
        guestEmail: 'another@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 600,
      });

      // Second booking should be flagged as conflicting
      expect(secondResult.booking.reservationStatus).toBe(
        ReservationStatus.PENDING_REVIEW,
      );
      expect(secondResult.hasConflict).toBe(true);

      // Should have EXACT_OVERLAP conflict
      expect(secondResult.timeBlock?.conflictType).toBe(
        ConflictType.EXACT_OVERLAP,
      );

      createdBookingIds.push(
        firstResult.booking._id.toString(),
        secondResult.booking._id.toString(),
      );
      if (secondResult.timeBlock) {
        createdTimeBlockIds.push(secondResult.timeBlock._id.toString());
      }
    });

    it('should handle multiple simultaneous duplicate bookings', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 35);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const baseResId = `res-multi-dup-${Date.now()}`;

      // Create 3 bookings with same dates
      const results: CreateBookingResponse[] = [];
      for (let i = 0; i < 3; i++) {
        const result = await bookingService.createBooking({
          externalReservationId: `${baseResId}-${i}`,
          propertyId: createdPropertyId,
          provider: 'hostaway',
          guestName: `Guest ${i}`,
          guestEmail: `guest${i}@example.com`,
          checkInDate,
          checkOutDate,
          numberOfGuests: 1,
          totalPrice: 300,
        });
        results.push(result);
      }

      // Check all bookings were created
      expect(results).toHaveLength(3);

      // First should be CONFIRMED, others PENDING_REVIEW
      const confirmedCount = results.filter(
        (r) => r.booking.reservationStatus === ReservationStatus.CONFIRMED,
      ).length;
      const pendingCount = results.filter(
        (r) => r.booking.reservationStatus === ReservationStatus.PENDING_REVIEW,
      ).length;

      expect(confirmedCount).toBe(1);
      expect(pendingCount).toBe(2);

      // Check time blocks created - query by primaryReservationId which is the external ID
      const timeBlocks = await timeBlockModel.find({
        primaryReservationId: {
          $in: results.map((r) => r.booking.externalReservationId),
        },
      });
      expect(timeBlocks.length).toBeGreaterThan(0);

      createdBookingIds.push(...results.map((r) => r.booking._id.toString()));
      createdTimeBlockIds.push(...timeBlocks.map((tb) => tb._id.toString()));
    });
  });

  describe('Conflict Scenarios', () => {
    it('should classify EXACT_OVERLAP conflict', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 40);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 3);

      const firstResId = `res-exact-${Date.now()}`;
      const firstResult = await bookingService.createBooking({
        externalReservationId: firstResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest A',
        guestEmail: 'guestA@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 450,
      });

      const secondResId = `res-exact-2-${Date.now()}`;
      const secondResult = await bookingService.createBooking({
        externalReservationId: secondResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest B',
        guestEmail: 'guestB@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 450,
      });

      expect(secondResult.timeBlock?.conflictType).toBe(
        ConflictType.EXACT_OVERLAP,
      );

      createdBookingIds.push(
        firstResult.booking._id.toString(),
        secondResult.booking._id.toString(),
      );
      if (secondResult.timeBlock) {
        createdTimeBlockIds.push(secondResult.timeBlock._id.toString());
      }
    });

    it('should classify PARTIAL_OVERLAP conflict', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 45);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 3);

      const firstResId = `res-partial-1-${Date.now()}`;
      const firstResult = await bookingService.createBooking({
        externalReservationId: firstResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest P1',
        guestEmail: 'guestp1@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 450,
      });

      // Partially overlapping: 1 day overlap
      const secondCheckIn = new Date(checkOutDate);
      secondCheckIn.setDate(secondCheckIn.getDate() - 1);
      const secondCheckOut = new Date(checkOutDate);
      secondCheckOut.setDate(secondCheckOut.getDate() + 2);

      const secondResId = `res-partial-2-${Date.now()}`;
      const secondResult = await bookingService.createBooking({
        externalReservationId: secondResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest P2',
        guestEmail: 'guestp2@example.com',
        checkInDate: secondCheckIn,
        checkOutDate: secondCheckOut,
        numberOfGuests: 1,
        totalPrice: 450,
      });

      expect(secondResult.timeBlock?.conflictType).toBe(
        ConflictType.PARTIAL_OVERLAP,
      );

      createdBookingIds.push(
        firstResult.booking._id.toString(),
        secondResult.booking._id.toString(),
      );
      if (secondResult.timeBlock) {
        createdTimeBlockIds.push(secondResult.timeBlock._id.toString());
      }
    });

    it('should classify COMPLETE_OVERLAP conflict (new booking contains existing)', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 50);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const firstResId = `res-complete-1-${Date.now()}`;
      const firstResult = await bookingService.createBooking({
        externalReservationId: firstResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest CO1',
        guestEmail: 'guestco1@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 300,
      });

      // New booking completely contains the first one
      const secondCheckIn = new Date(checkInDate);
      secondCheckIn.setDate(secondCheckIn.getDate() - 1);
      const secondCheckOut = new Date(checkOutDate);
      secondCheckOut.setDate(secondCheckOut.getDate() + 1);

      const secondResId = `res-complete-2-${Date.now()}`;
      const secondResult = await bookingService.createBooking({
        externalReservationId: secondResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest CO2',
        guestEmail: 'guestco2@example.com',
        checkInDate: secondCheckIn,
        checkOutDate: secondCheckOut,
        numberOfGuests: 1,
        totalPrice: 600,
      });

      expect(secondResult.timeBlock?.conflictType).toBe(
        ConflictType.COMPLETE_OVERLAP,
      );

      createdBookingIds.push(
        firstResult.booking._id.toString(),
        secondResult.booking._id.toString(),
      );
      if (secondResult.timeBlock) {
        createdTimeBlockIds.push(secondResult.timeBlock._id.toString());
      }
    });

    it('should allow ADJACENT bookings (no overlap)', async () => {
      const checkInDate = new Date();
      checkInDate.setDate(checkInDate.getDate() + 55);
      const checkOutDate = new Date(checkInDate);
      checkOutDate.setDate(checkOutDate.getDate() + 2);

      const firstResId = `res-adj-1-${Date.now()}`;
      const firstResult = await bookingService.createBooking({
        externalReservationId: firstResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest ADJ1',
        guestEmail: 'guestadj1@example.com',
        checkInDate,
        checkOutDate,
        numberOfGuests: 1,
        totalPrice: 300,
      });

      // Adjacent: second booking starts when first ends
      const secondCheckIn = new Date(checkOutDate);
      const secondCheckOut = new Date(secondCheckIn);
      secondCheckOut.setDate(secondCheckOut.getDate() + 2);

      const secondResId = `res-adj-2-${Date.now()}`;
      const secondResult = await bookingService.createBooking({
        externalReservationId: secondResId,
        propertyId: createdPropertyId,
        provider: 'hostaway',
        guestName: 'Guest ADJ2',
        guestEmail: 'guestadj2@example.com',
        checkInDate: secondCheckIn,
        checkOutDate: secondCheckOut,
        numberOfGuests: 1,
        totalPrice: 300,
      });

      // Adjacent bookings should not create conflicts
      expect(secondResult.booking.reservationStatus).toBe(
        ReservationStatus.CONFIRMED,
      );
      expect(secondResult.hasConflict).toBe(false);

      createdBookingIds.push(
        firstResult.booking._id.toString(),
        secondResult.booking._id.toString(),
      );
    });

    it('should handle property with multiple overlapping bookings', async () => {
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 60);

      // Create 5 bookings with various overlaps
      const results: CreateBookingResponse[] = [];
      for (let i = 0; i < 5; i++) {
        const checkIn = new Date(baseDate);
        checkIn.setDate(checkIn.getDate() + i);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 3);

        const resId = `res-multi-${i}-${Date.now()}`;

        const result = await bookingService.createBooking({
          externalReservationId: resId,
          propertyId: createdPropertyId,
          provider: 'hostaway',
          guestName: `Guest ${i}`,
          guestEmail: `guestm${i}@example.com`,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfGuests: 1,
          totalPrice: 450,
        });

        results.push(result);
        createdBookingIds.push(result.booking._id.toString());
      }

      // Verify all bookings created
      expect(results).toHaveLength(5);

      // First should be confirmed, rest should be pending review
      const confirmedCount = results.filter(
        (r) => r.booking.reservationStatus === ReservationStatus.CONFIRMED,
      ).length;
      expect(confirmedCount).toBe(1);

      // All conflicts should be tracked
      const conflicts = await timeBlockModel.find({
        primaryReservationId: {
          $in: results.map((r) => r.booking.externalReservationId),
        },
      });
      expect(conflicts.length).toBeGreaterThan(0);

      createdTimeBlockIds.push(...conflicts.map((c) => c._id.toString()));
    });
  });
});
