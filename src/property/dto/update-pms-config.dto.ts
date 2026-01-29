import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

/**
 * DTO for updating a PMS configuration
 */
export class UpdatePmsConfigDto {
  @ApiPropertyOptional({
    description: 'External property ID in the PMS system',
    example: '12345',
  })
  @IsString()
  @IsOptional()
  externalPropertyId?: string;

  @ApiPropertyOptional({
    description: 'Whether the PMS integration is enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;
}
