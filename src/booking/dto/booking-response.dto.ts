import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus, ReservationStatus } from '../entities/booking.entity';

export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking ID',
    example: '65f1a1c2b3d4e5f6a7b8c9d0',
  })
  id: string;

  @ApiProperty({ description: 'External reservation ID', example: '123456789' })
  externalReservationId: string;

  @ApiProperty({
    description: 'Property ID',
    example: '65f1a1c2b3d4e5f6a7b8c9d0',
  })
  propertyId: string;

  @ApiProperty({
    description: 'PMS provider name',
    enum: ['hostaway', 'guesty'],
    example: 'hostaway',
  })
  provider: 'hostaway' | 'guesty';

  @ApiProperty({ description: 'Guest full name', example: 'John Doe' })
  guestName: string;

  @ApiPropertyOptional({
    description: 'Guest email address',
    example: 'john@example.com',
  })
  guestEmail?: string;

  @ApiPropertyOptional({
    description: 'Guest phone number',
    example: '+1-555-555-5555',
  })
  guestPhone?: string;

  @ApiProperty({
    description: 'Check-in date (ISO 8601)',
    example: '2026-02-01T15:00:00.000Z',
  })
  checkInDate: string;

  @ApiProperty({
    description: 'Check-out date (ISO 8601)',
    example: '2026-02-05T11:00:00.000Z',
  })
  checkOutDate: string;

  @ApiProperty({ description: 'Number of nights', example: 4 })
  numberOfNights: number;

  @ApiProperty({ description: 'Number of guests', example: 2 })
  numberOfGuests: number;

  @ApiPropertyOptional({
    description: 'Total price for the booking',
    example: 450,
  })
  totalPrice?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  currency?: string;

  @ApiProperty({
    description: 'Reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.CONFIRMED,
  })
  reservationStatus: ReservationStatus;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Time block ID (if conflict detected)',
    example: '65f1a1c2b3d4e5f6a7b8c9d1',
  })
  timeBlockId?: string;

  @ApiPropertyOptional({
    description: 'Notes or special requests',
    example: 'Late check-in requested',
  })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Cancellation timestamp (ISO 8601)',
    example: '2026-02-02T12:00:00.000Z',
  })
  cancelledAt?: string;

  @ApiPropertyOptional({
    description: 'Cancellation reason',
    example: 'Guest request',
  })
  cancelReason?: string;

  @ApiPropertyOptional({
    description: 'Created at timestamp',
    example: '2026-02-01T10:00:00.000Z',
  })
  createdAt?: string;

  @ApiPropertyOptional({
    description: 'Updated at timestamp',
    example: '2026-02-01T10:00:00.000Z',
  })
  updatedAt?: string;
}
