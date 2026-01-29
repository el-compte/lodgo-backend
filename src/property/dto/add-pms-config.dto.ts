import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for adding a PMS configuration to a property
 */
export class AddPmsConfigDto {
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
