import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for PMS Configuration
 * Defines validation rules for PMS provider configuration
 */
export class PmsConfigDto {
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
    description: 'External property ID in the PMS system',
    example: '12345',
  })
  @IsString()
  @IsNotEmpty()
  externalPropertyId: string;

  @ApiPropertyOptional({
    description: 'Whether the PMS integration is enabled',
    default: true,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}

/**
 * DTO for creating a new property
 * Contains property details and optional PMS configurations
 */
export class CreatePropertyDto {
  @ApiProperty({
    description: 'Name of the property',
    example: 'Luxury Beach House',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Address of the property',
    example: '123 Ocean Drive, Miami, FL',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    description: 'Array of PMS configurations for the property',
    type: [PmsConfigDto],
    example: [
      {
        provider: 'hostaway',
        externalPropertyId: '12345',
        enabled: true,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PmsConfigDto)
  @IsOptional()
  pmsConfigs?: PmsConfigDto[];
}
