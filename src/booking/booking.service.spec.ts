import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BookingService } from './booking.service';
import { ReservationStatus } from './entities/booking.entity';
import { ConflictType, TimeBlockStatus } from './entities/timeblock.entity';

type BookingDoc = Record<string, unknown>;

interface MockModel<TDocument extends BookingDoc> {
  (dto: TDocument): TDocument & {
    _id: string;
    save: jest.Mock;
  };
  find: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
}

interface MockTimeBlockModel<
  TDocument extends BookingDoc,
> extends MockModel<TDocument> {
  find: jest.Mock;
  findByIdAndUpdate: jest.Mock;
  findOne: jest.Mock;
  findById: jest.Mock;
}

describe('BookingService', () => {
  let service: BookingService;
  let bookingModel: MockModel<BookingDoc>;
  let timeBlockModel: MockTimeBlockModel<BookingDoc>;

  const buildBookingDoc = (dto: BookingDoc) => ({
    _id: 'booking-id',
    ...dto,
    save: jest.fn().mockResolvedValue({ _id: 'booking-id', ...dto }),
  });

  const mockBookingModel: MockModel<BookingDoc> = function (dto: BookingDoc) {
    return buildBookingDoc(dto);
  };

  mockBookingModel.find = jest.fn();
  mockBookingModel.findOne = jest.fn();
  mockBookingModel.findById = jest.fn();
  mockBookingModel.findByIdAndUpdate = jest.fn();

  const mockTimeBlockModel: any = function (dto: BookingDoc) {
    return {
      _id: 'timeblock-id',
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'timeblock-id', ...dto }),
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  mockTimeBlockModel.find = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  mockTimeBlockModel.findOne = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  mockTimeBlockModel.findById = jest.fn();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  mockTimeBlockModel.findByIdAndUpdate = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: getModelToken('Booking'),
          useValue: mockBookingModel,
        },
        {
          provide: getModelToken('TimeBlock'),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          useValue: mockTimeBlockModel,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
    bookingModel = module.get(getModelToken('Booking')) as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion
    timeBlockModel = module.get(getModelToken('TimeBlock')) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    it('should create a booking without conflicts', async () => {
      jest.spyOn(bookingModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.createBooking({
        externalReservationId: 'res-1',
        propertyId: '507f1f77bcf86cd799439011',
        provider: 'hostaway',
        guestName: 'John Doe',
        checkInDate: new Date('2026-02-01T15:00:00.000Z'),
        checkOutDate: new Date('2026-02-05T11:00:00.000Z'),
        numberOfGuests: 2,
      });

      expect(result.hasConflict).toBe(false);
      expect(result.booking).toBeDefined();
      expect(result.booking.reservationStatus).toBe(
        ReservationStatus.CONFIRMED,
      );
      expect(bookingModel.find).toHaveBeenCalled();
    });

    it('should create a booking with conflicts and time block', async () => {
      const conflict: BookingDoc = {
        externalReservationId: 'res-conflict',
        checkInDate: new Date('2026-02-01T15:00:00.000Z'),
        checkOutDate: new Date('2026-02-03T11:00:00.000Z'),
      };

      jest.spyOn(bookingModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([conflict]),
      } as any);

      const result = await service.createBooking({
        externalReservationId: 'res-2',
        propertyId: '507f1f77bcf86cd799439011',
        provider: 'hostaway',
        guestName: 'Jane Doe',
        checkInDate: new Date('2026-02-02T15:00:00.000Z'),
        checkOutDate: new Date('2026-02-04T11:00:00.000Z'),
        numberOfGuests: 2,
      });

      expect(result.hasConflict).toBe(true);
      expect(result.timeBlock).toBeDefined();
      expect(result.timeBlock?.status).toBe(TimeBlockStatus.PENDING_REVIEW);
      expect(bookingModel.find).toHaveBeenCalled();
    });
  });

  describe('conflict classification', () => {
    it('should classify exact overlap', () => {
      const serviceInternal = service as unknown as {
        classifyConflict: (
          existingCheckIn: Date,
          existingCheckOut: Date,
          newCheckIn: Date,
          newCheckOut: Date,
        ) => ConflictType;
      };

      const result = serviceInternal.classifyConflict(
        new Date('2026-02-01'),
        new Date('2026-02-05'),
        new Date('2026-02-01'),
        new Date('2026-02-05'),
      );

      expect(result).toBe(ConflictType.EXACT_OVERLAP);
    });

    it('should classify complete overlap', () => {
      const serviceInternal = service as unknown as {
        classifyConflict: (
          existingCheckIn: Date,
          existingCheckOut: Date,
          newCheckIn: Date,
          newCheckOut: Date,
        ) => ConflictType;
      };

      const result = serviceInternal.classifyConflict(
        new Date('2026-02-03'),
        new Date('2026-02-05'),
        new Date('2026-02-01'),
        new Date('2026-02-10'),
      );

      expect(result).toBe(ConflictType.COMPLETE_OVERLAP);
    });

    it('should classify partial overlap', () => {
      const serviceInternal = service as unknown as {
        classifyConflict: (
          existingCheckIn: Date,
          existingCheckOut: Date,
          newCheckIn: Date,
          newCheckOut: Date,
        ) => ConflictType;
      };

      const result = serviceInternal.classifyConflict(
        new Date('2026-02-01'),
        new Date('2026-02-05'),
        new Date('2026-02-04'),
        new Date('2026-02-08'),
      );

      expect(result).toBe(ConflictType.PARTIAL_OVERLAP);
    });

    it('should classify adjacent dates', () => {
      const serviceInternal = service as unknown as {
        classifyConflict: (
          existingCheckIn: Date,
          existingCheckOut: Date,
          newCheckIn: Date,
          newCheckOut: Date,
        ) => ConflictType;
      };

      const result = serviceInternal.classifyConflict(
        new Date('2026-02-01'),
        new Date('2026-02-05'),
        new Date('2026-02-05'),
        new Date('2026-02-08'),
      );

      expect(result).toBe(ConflictType.ADJACENT);
    });
  });

  describe('overlap calculation', () => {
    it('should calculate overlap days correctly', () => {
      const serviceInternal = service as unknown as {
        calculateOverlapDays: (
          existingStart: Date,
          existingEnd: Date,
          newStart: Date,
          newEnd: Date,
        ) => number;
      };

      const overlapDays = serviceInternal.calculateOverlapDays(
        new Date('2026-02-01T00:00:00.000Z'),
        new Date('2026-02-05T00:00:00.000Z'),
        new Date('2026-02-03T00:00:00.000Z'),
        new Date('2026-02-07T00:00:00.000Z'),
      );

      expect(overlapDays).toBe(2);
    });
  });

  describe('updateBooking', () => {
    it('should set status to PENDING_REVIEW when date changes cause conflicts', async () => {
      const booking: BookingDoc = {
        externalReservationId: 'res-3',
        propertyId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        checkInDate: new Date('2026-02-01T15:00:00.000Z'),
        checkOutDate: new Date('2026-02-05T11:00:00.000Z'),
        reservationStatus: ReservationStatus.CONFIRMED,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(bookingModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(booking),
      } as any);

      jest.spyOn(bookingModel, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            externalReservationId: 'res-conflict',
            checkInDate: new Date('2026-02-02T15:00:00.000Z'),
            checkOutDate: new Date('2026-02-04T11:00:00.000Z'),
          },
        ]),
      } as any);

      const result = await service.updateBooking('res-3', {
        checkInDate: new Date('2026-02-02T15:00:00.000Z'),
      } as Partial<BookingDoc>);

      expect(result.reservationStatus).toBe(ReservationStatus.PENDING_REVIEW);
      expect(booking.save).toHaveBeenCalled();
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking and resolve time block', async () => {
      const booking: BookingDoc = {
        externalReservationId: 'res-4',
        propertyId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        reservationStatus: ReservationStatus.CONFIRMED,
        timeBlockId: new Types.ObjectId('507f1f77bcf86cd799439012'),
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(bookingModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(booking),
      } as any);

      await service.cancelBooking('res-4', 'Guest request');

      expect(booking.reservationStatus).toBe(ReservationStatus.CANCELLED);
      expect(booking.save).toHaveBeenCalled();
      expect(timeBlockModel.findByIdAndUpdate).toHaveBeenCalled();
    });
  });
});
