import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { AddPmsConfigDto } from './dto/add-pms-config.dto';
import { UpdatePmsConfigDto } from './dto/update-pms-config.dto';

@ApiTags('property')
@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({ status: 201, description: 'Property created successfully' })
  create(@Body() createPropertyDto: CreatePropertyDto) {
    return this.propertyService.create(createPropertyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties' })
  @ApiResponse({ status: 200, description: 'Returns all properties' })
  findAll() {
    return this.propertyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a property by ID' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Returns the property' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property updated successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertyService.update(id, updatePropertyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property deleted successfully' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }

  // PMS Config Management Endpoints

  @Post(':id/pms-config')
  @ApiOperation({ summary: 'Add PMS configuration to a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 201,
    description: 'PMS configuration added successfully',
  })
  @ApiResponse({ status: 404, description: 'Property not found' })
  addPmsConfig(
    @Param('id') id: string,
    @Body() addPmsConfigDto: AddPmsConfigDto,
  ) {
    return this.propertyService.addPmsConfig(id, addPmsConfigDto);
  }

  @Get(':id/pms-config')
  @ApiOperation({ summary: 'Get all PMS configurations for a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns all PMS configurations',
  })
  @ApiResponse({ status: 404, description: 'Property not found' })
  getAllPmsConfigs(@Param('id') id: string) {
    return this.propertyService.getAllPmsConfigs(id);
  }

  @Patch(':id/pms-config/:provider')
  @ApiOperation({ summary: 'Update PMS configuration for a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiParam({
    name: 'provider',
    description: 'PMS provider name',
    enum: ['hostaway', 'guesty'],
  })
  @ApiResponse({
    status: 200,
    description: 'PMS configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Property or config not found' })
  updatePmsConfig(
    @Param('id') id: string,
    @Param('provider') provider: string,
    @Body() updatePmsConfigDto: UpdatePmsConfigDto,
  ) {
    return this.propertyService.updatePmsConfig(
      id,
      provider,
      updatePmsConfigDto,
    );
  }

  @Delete(':id/pms-config/:provider')
  @ApiOperation({ summary: 'Remove PMS configuration from a property' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiParam({
    name: 'provider',
    description: 'PMS provider name',
    enum: ['hostaway', 'guesty'],
  })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'PMS configuration removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Property not found' })
  removePmsConfig(
    @Param('id') id: string,
    @Param('provider') provider: string,
  ) {
    return this.propertyService.removePmsConfig(id, provider);
  }

  @Get(':id/webhook-eligibility')
  @ApiOperation({
    summary: 'Check if property is eligible for webhook processing',
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns webhook eligibility status',
    schema: {
      type: 'object',
      properties: {
        eligible: { type: 'boolean' },
        propertyId: { type: 'string' },
      },
    },
  })
  async checkWebhookEligibility(@Param('id') id: string) {
    const eligible =
      await this.propertyService.isPropertyEligibleForWebhook(id);
    return {
      eligible,
      propertyId: id,
    };
  }
}
