import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CoordinatesDto {
  @ApiProperty()
  @IsNumber()
  lat: number;

  @ApiProperty()
  @IsNumber()
  lng: number;
}

class LocationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  addressLine1?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zipcode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fullAddress?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  publicAddress?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  roomnumber?: string;

  @ApiPropertyOptional({ type: () => CoordinatesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}

class CapacityDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  guests?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  bedrooms?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  beds?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  bathrooms?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  squareMeters?: number;
}

class PricingDiscountsDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  weekly?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  monthly?: number;
}

class PricingDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  cleaningFee?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  refundableDeposit?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  extraGuestFee?: number;

  @ApiPropertyOptional({ type: () => PricingDiscountsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingDiscountsDto)
  discounts?: PricingDiscountsDto;
}

class CheckInOutDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  checkInStart?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  checkInEnd?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  checkOutTime?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  keyPickup?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  doorCode?: string;
}

class PoliciesCancellationDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  ids?: Record<string, number>;
}

class PoliciesRentalAgreementDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  text?: string;
}

class PoliciesDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  houseRules?: string;

  @ApiPropertyOptional({ type: () => PoliciesCancellationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PoliciesCancellationDto)
  cancellation?: PoliciesCancellationDto;

  @ApiPropertyOptional({ type: () => PoliciesRentalAgreementDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PoliciesRentalAgreementDto)
  rentalAgreement?: PoliciesRentalAgreementDto;
}

class ContactDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  phones?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

class ImageDto {
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  externalId?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty()
  @IsString()
  url: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  order?: number;
}

class BedDto {
  @ApiProperty()
  @IsNumber()
  bedTypeId: number;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

class PmsConfigDto {
  @ApiProperty({ enum: ['hostaway', 'guesty'] })
  @IsEnum(['hostaway', 'guesty'])
  provider: 'hostaway' | 'guesty';

  @ApiProperty()
  @IsString()
  externalPropertyId: string;

  @ApiProperty()
  @IsBoolean()
  enabled: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  lastSyncedAt?: Date;
}

export class CreateListingDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  internalName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ type: () => LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({ type: () => CapacityDto })
  @ValidateNested()
  @Type(() => CapacityDto)
  capacity: CapacityDto;

  @ApiProperty({ type: () => PricingDto })
  @ValidateNested()
  @Type(() => PricingDto)
  pricing: PricingDto;

  @ApiProperty({ type: () => CheckInOutDto })
  @ValidateNested()
  @Type(() => CheckInOutDto)
  checkInOut: CheckInOutDto;

  @ApiProperty({ type: () => PoliciesDto })
  @ValidateNested()
  @Type(() => PoliciesDto)
  policies: PoliciesDto;

  @ApiProperty({ type: [ContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contact: ContactDto[];

  @ApiProperty({ type: [ImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImageDto)
  images: ImageDto[];

  @ApiProperty({ type: [BedDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BedDto)
  beds: BedDto[];

  @ApiProperty({ type: () => PmsConfigDto })
  @ValidateNested()
  @Type(() => PmsConfigDto)
  pms: PmsConfigDto;

  @ApiPropertyOptional()
  @IsOptional()
  rawPmsData?: Record<string, any>;
}
