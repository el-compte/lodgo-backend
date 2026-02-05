import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { IListing } from './entities/listing.entity';
import { ListingPmsConfig } from './entities/pms-config.entity';

@Injectable()
export class ListingService {
  /** Logger instance for ListingService */
  private readonly logger = new Logger(ListingService.name);

  constructor(
    @InjectModel('Listing') private readonly listingModel: Model<IListing>,
  ) {}

  /**
   * Create a new listing
   * @param createListingDto - DTO containing listing data
   * @returns Created listing document
   */
  async create(createListingDto: CreateListingDto): Promise<IListing> {
    const createdListing = new this.listingModel(createListingDto);
    return createdListing.save();
  }

  /**
   * Find all properties
   * @returns Array of all listing documents
   */
  async findAll(): Promise<IListing[]> {
    return this.listingModel.find().exec();
  }

  /**
   * Find a listing by ID
   * @param id - Listing ID
   * @returns Listing document
   * @throws NotFoundException if listing not found
   */
  async findOne(id: string): Promise<IListing> {
    const listing = await this.listingModel.findById(id).exec();

    if (!listing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return listing;
  }

  /**
   * Update a listing
   * @param id - Listing ID
   * @param updateListingDto - DTO containing updated listing data
   * @returns Updated listing document
   * @throws NotFoundException if listing not found
   */
  async update(
    id: string,
    updateListingDto: UpdateListingDto,
  ): Promise<IListing> {
    const updatedListing = await this.listingModel
      .findByIdAndUpdate(id, updateListingDto, { new: true })
      .exec();

    if (!updatedListing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return updatedListing;
  }

  /**
   * Remove a listing
   * @param id - Listing ID
   * @returns Deleted listing document
   * @throws NotFoundException if listing not found
   */
  async remove(id: string): Promise<IListing> {
    const deletedListing = await this.listingModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedListing) {
      throw new NotFoundException(`Listing with ID ${id} not found`);
    }

    return deletedListing;
  }

  /**
   * Find a listing by external property ID and provider
   * @param provider - PMS provider name (hostaway, guesty)
   * @param externalPropertyId - External property ID in the PMS system
   * @returns Listing document or null if not found
   */
  async findByExternalPropertyId(
    provider: string,
    externalPropertyId: string,
  ): Promise<IListing | null> {
    return this.listingModel
      .findOne({
        'pms.provider': provider,
        'pms.externalPropertyId': externalPropertyId,
      })
      .exec();
  }

  /**
   * Get PMS configuration for a listing
   * @param listingId - Listing ID
   * @returns PMS config or null if not found
   * @throws NotFoundException if listing not found
   */
  async getPmsConfig(
    listingId: string,
  ): Promise<ListingPmsConfig | null> {
    const listing = await this.findOne(listingId);

    if (!listing.pms) {
      return null;
    }

    return listing.pms;
  }

  /**
   * Check if a listing is eligible for webhook processing
   * A listing is eligible if:
   * 1. Listing exists
   * 2. Has PMS configuration
   * 3. PMS config has provider field
   * 4. PMS config has externalPropertyId
   * 5. PMS config enabled flag is true
   *
   * @param listingId - Listing ID
   * @returns True if listing is eligible, false otherwise
   */
  async isListingEligibleForWebhook(listingId: string): Promise<boolean> {
    try {
      const listing = await this.findOne(listingId);

      // Check if listing has PMS config
      if (!listing.pms) {
        return false;
      }

      // Check if PMS config is valid and enabled
      return  !!listing.pms.provider &&
        !!listing.pms.externalListingId &&
        listing.pms.enabled === true;
      ;
    } catch (error) {
      this.logger.error(`Error checking listing eligibility`, error);
      return false;
    }
  }

  /**
   * Check if a listing with external ID is eligible for webhook processing
   * @param provider - PMS provider name
   * @param externalPropertyId - External property ID
   * @returns True if listing is eligible, false otherwise
   */
  async isListingEligibleForWebhookByExternalId(
    provider: string,
    externalPropertyId: string,
  ): Promise<boolean> {
    const listing = await this.findByExternalPropertyId(
      provider,
      externalPropertyId,
    );

    if (!listing || !listing.pms) {
      return false;
    }

    // Check if the PMS config matches the provider and is enabled
    return (
      listing.pms.provider === provider && listing.pms.enabled === true
    );
  }

  /**
   * Set PMS configuration for a listing
   * @param listingId - Listing ID
   * @param pmsConfig - PMS configuration to set
   * @returns Updated listing document
   * @throws NotFoundException if listing not found
   */
  async setPmsConfig(
    listingId: string,
    pmsConfig: ListingPmsConfig,
  ): Promise<IListing> {
    const listing = await this.findOne(listingId);

    listing.pms = {
      provider: pmsConfig.provider,
      externalListingId: pmsConfig.externalListingId,
      enabled: pmsConfig.enabled ?? true,
      lastSyncedAt: pmsConfig.lastSyncedAt,
    };

    return listing.save();
  }

  /**
   * Update PMS configuration for a listing
   * @param listingId - Listing ID
   * @param updates - Partial PMS config updates
   * @returns Updated listing document
   * @throws NotFoundException if listing or config not found
   */
  async updatePmsConfig(
    listingId: string,
    updates: Partial<ListingPmsConfig>,
  ): Promise<IListing> {
    const listing = await this.findOne(listingId);

    if (!listing.pms) {
      throw new NotFoundException(
        `PMS config not found for listing ${listingId}`,
      );
    }

    listing.pms = {
      provider: updates.provider ?? listing.pms.provider,
      externalListingId:
        updates.externalListingId ?? listing.pms.externalListingId,
      enabled: updates.enabled ?? listing.pms.enabled,
      lastSyncedAt: updates.lastSyncedAt ?? listing.pms.lastSyncedAt,
    };

    return listing.save();
  }

  /**
   * Remove PMS configuration from a listing
   * @param listingId - Listing ID
   * @returns Updated listing document
   * @throws NotFoundException if listing not found
   */
  async removePmsConfig(
    listingId: string,
  ): Promise<IListing> {
    const listing = await this.findOne(listingId);

    listing.pms = undefined;

    return listing.save();
  }

  /**
   * Sync listing data from a PMS webhook to update listing information
   * Updates the listing title, description, location, pricing and raw data
   * @param listingId - Listing ID
   * @param listingData - Listing data from the PMS webhook
   * @returns Updated listing document
   * @throws NotFoundException if listing not found
   */
  async syncListingData(
    listingId: string,
    listingData: Record<string, any>,
  ): Promise<IListing> {
    const listing = await this.findOne(listingId);

    if (listingData.title) {
      listing.title = listingData.title;
    }

    if (listingData.description) {
      listing.description = listingData.description;
    }

    if (listingData.location) {
      listing.location = { ...listing.location, ...listingData.location };
    }

    if (listingData.pricing) {
      listing.pricing = { ...listing.pricing, ...listingData.pricing };
    }

    if (listingData.rawPmsData) {
      listing.rawPmsData = listingData.rawPmsData;
    }

    if (listing.pms) {
      listing.pms.lastSyncedAt = new Date();
    }

    return listing.save();
  }
}
