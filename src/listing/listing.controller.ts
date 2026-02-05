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
import { ListingService } from './listing.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

@ApiTags('listing')
@Controller('listing')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({ status: 201, description: 'Listing created successfully' })
  create(@Body() createListingDto: CreateListingDto) {
    return this.listingService.create(createListingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties' })
  @ApiResponse({ status: 200, description: 'Returns all properties' })
  findAll() {
    return this.listingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a listing by ID' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Returns the listing' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  findOne(@Param('id') id: string) {
    return this.listingService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing updated successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  update(
    @Param('id') id: string,
    @Body() updateListingDto: UpdateListingDto,
  ) {
    return this.listingService.update(id, updateListingDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({ status: 200, description: 'Listing deleted successfully' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  remove(@Param('id') id: string) {
    return this.listingService.remove(id);
  }

  // PMS Config Management Endpoints

  @Post(':id/pms-config')
  @ApiOperation({ summary: 'Set PMS configuration for a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 201,
    description: 'PMS configuration set successfully',
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  setPmsConfig(
    @Param('id') id: string,
    @Body() pmsConfig: any,
  ) {
    return this.listingService.setPmsConfig(id, pmsConfig);
  }

  @Get(':id/pms-config')
  @ApiOperation({ summary: 'Get PMS configuration for a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns PMS configuration',
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  getPmsConfig(@Param('id') id: string) {
    return this.listingService.getPmsConfig(id);
  }

  @Patch(':id/pms-config')
  @ApiOperation({ summary: 'Update PMS configuration for a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'PMS configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Listing or config not found' })
  updatePmsConfig(
    @Param('id') id: string,
    @Body() updates: any,
  ) {
    return this.listingService.updatePmsConfig(id, updates);
  }

  @Delete(':id/pms-config')
  @ApiOperation({ summary: 'Remove PMS configuration from a listing' })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: 200,
    description: 'PMS configuration removed successfully',
  })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  removePmsConfig(
    @Param('id') id: string,
  ) {
    return this.listingService.removePmsConfig(id);
  }

  @Get(':id/webhook-eligibility')
  @ApiOperation({
    summary: 'Check if listing is eligible for webhook processing',
  })
  @ApiParam({ name: 'id', description: 'Listing ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns webhook eligibility status',
    schema: {
      type: 'object',
      properties: {
        eligible: { type: 'boolean' },
        listingId: { type: 'string' },
      },
    },
  })
  async checkWebhookEligibility(@Param('id') id: string) {
    const eligible =
      await this.listingService.isListingEligibleForWebhook(id);
    return {
      eligible,
      listingId: id,
    };
  }
}
