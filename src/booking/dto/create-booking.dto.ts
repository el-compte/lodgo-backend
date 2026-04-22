import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { PaymentStatus, ReservationStatus } from '../entities/booking.entity';

export class CreateBookingDto {
  @ApiProperty({
    description:
      'External reservation ID from PMS (e.g., Hostaway reservationId)',
    example: '123456789',
  })
  @IsString()
  @IsNotEmpty()
  externalReservationId: string;

  @ApiProperty({
    description: 'Property ID in the system',
    example: '65f1a1c2b3d4e5f6a7b8c9d0',
  })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({
    description: 'PMS provider name',
    enum: ['hostaway', 'guesty'],
    example: 'hostaway',
  })
  @IsEnum(['hostaway', 'guesty'], {
    message: 'Provider must be either hostaway or guesty',
  })
  @IsNotEmpty()
  provider: 'hostaway' | 'guesty';

  @ApiProperty({
    description: 'Guest full name',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  guestName: string;

  @ApiPropertyOptional({
    description: 'Guest email address',
    example: 'john@example.com',
  })
  @IsString()
  @IsOptional()
  guestEmail?: string;

  @ApiPropertyOptional({
    description: 'Guest phone number',
    example: '+1-555-555-5555',
  })
  @IsString()
  @IsOptional()
  guestPhone?: string;

  @ApiProperty({
    description: 'Check-in date (ISO 8601)',
    example: '2026-02-01T15:00:00.000Z',
  })
  @IsDateString()
  checkInDate: string;

  @ApiProperty({
    description: 'Check-out date (ISO 8601)',
    example: '2026-02-05T11:00:00.000Z',
  })
  @IsDateString()
  checkOutDate: string;

  @ApiProperty({
    description: 'Number of nights',
    example: 4,
  })
  @IsNumber()
  @Min(1)
  numberOfNights: number;

  @ApiProperty({
    description: 'Number of guests',
    example: 2,
  })
  @IsNumber()
  @Min(1)
  numberOfGuests: number;

  @ApiPropertyOptional({
    description: 'Total price for the booking',
    example: 450,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalPrice?: number;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Reservation status',
    enum: ReservationStatus,
    example: ReservationStatus.CONFIRMED,
  })
  @IsEnum(ReservationStatus)
  @IsOptional()
  reservationStatus?: ReservationStatus;

  @ApiPropertyOptional({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({
    description: 'Notes or special requests',
    example: 'Late check-in requested',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
