import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { IProperty } from './entities/property.entity';
import { PropertyPmsConfig } from './entities/pms-config.entity';
import { AddPmsConfigDto } from './dto/add-pms-config.dto';

@Injectable()
export class PropertyService {
  /** Logger instance for PropertyService */
  private readonly logger = new Logger(PropertyService.name);

  constructor(
    @InjectModel('Property') private readonly propertyModel: Model<IProperty>,
  ) {}

  /**
   * Create a new property
   * @param createPropertyDto - DTO containing property data
   * @returns Created property document
   */
  async create(createPropertyDto: CreatePropertyDto): Promise<IProperty> {
    const createdProperty = new this.propertyModel(createPropertyDto);
    return createdProperty.save();
  }

  /**
   * Find all properties
   * @returns Array of all property documents
   */
  async findAll(): Promise<IProperty[]> {
    return this.propertyModel.find().exec();
  }

  /**
   * Find a property by ID
   * @param id - Property ID
   * @returns Property document
   * @throws NotFoundException if property not found
   */
  async findOne(id: string): Promise<IProperty> {
    const property = await this.propertyModel.findById(id).exec();

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  /**
   * Update a property
   * @param id - Property ID
   * @param updatePropertyDto - DTO containing updated property data
   * @returns Updated property document
   * @throws NotFoundException if property not found
   */
  async update(
    id: string,
    updatePropertyDto: UpdatePropertyDto,
  ): Promise<IProperty> {
    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true })
      .exec();

    if (!updatedProperty) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return updatedProperty;
  }

  /**
   * Remove a property
   * @param id - Property ID
   * @returns Deleted property document
   * @throws NotFoundException if property not found
   */
  async remove(id: string): Promise<IProperty> {
    const deletedProperty = await this.propertyModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedProperty) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return deletedProperty;
  }

  /**
   * Find a property by external property ID and provider
   * @param provider - PMS provider name (hostaway, guesty)
   * @param externalPropertyId - External property ID in the PMS system
   * @returns Property document or null if not found
   */
  async findByExternalPropertyId(
    provider: string,
    externalPropertyId: string,
  ): Promise<IProperty | null> {
    return this.propertyModel
      .findOne({
        'pmsConfigs.provider': provider,
        'pmsConfigs.externalPropertyId': externalPropertyId,
      })
      .exec();
  }

  /**
   * Get PMS configuration for a property and provider
   * @param propertyId - Property ID
   * @param provider - PMS provider name
   * @returns PMS config or null if not found
   * @throws NotFoundException if property not found
   */
  async getPmsConfig(
    propertyId: string,
    provider: string,
  ): Promise<PropertyPmsConfig | null> {
    const property = await this.findOne(propertyId);

    if (!property.pmsConfigs || property.pmsConfigs.length === 0) {
      return null;
    }

    const config = property.pmsConfigs.find((c) => c.provider === provider);
    return config || null;
  }

  /**
   * Check if a property is eligible for webhook processing
   * A property is eligible if:
   * 1. Property exists
   * 2. Has at least one PMS config
   * 3. PMS config has provider field
   * 4. PMS config has externalPropertyId
   * 5. PMS config enabled flag is true
   *
   * @param propertyId - Property ID
   * @returns True if property is eligible, false otherwise
   */
  async isPropertyEligibleForWebhook(propertyId: string): Promise<boolean> {
    try {
      const property = await this.findOne(propertyId);

      // Check if property has PMS configs
      if (!property.pmsConfigs || property.pmsConfigs.length === 0) {
        return false;
      }

      // Check if at least one PMS config is valid and enabled
      return property.pmsConfigs.some(
        (config) =>
          config.provider &&
          config.externalPropertyId &&
          config.enabled === true,
      );
    } catch (error) {
      this.logger.error(`Error checking property eligibility`, error);
      return false;
    }
  }

  /**
   * Check if a property with external ID is eligible for webhook processing
   * @param provider - PMS provider name
   * @param externalPropertyId - External property ID
   * @returns True if property is eligible, false otherwise
   */
  async isPropertyEligibleForWebhookByExternalId(
    provider: string,
    externalPropertyId: string,
  ): Promise<boolean> {
    const property = await this.findByExternalPropertyId(
      provider,
      externalPropertyId,
    );

    if (!property) {
      return false;
    }

    // Find the specific PMS config for this provider
    const config = property.pmsConfigs.find((c) => c.provider === provider);

    if (!config) {
      return false;
    }

    // Check if the config is enabled
    return config.enabled === true;
  }

  /**
   * Add a PMS configuration to a property
   * @param propertyId - Property ID
   * @param pmsConfig - PMS configuration to add
   * @returns Updated property document
   * @throws NotFoundException if property not found
   */
  async addPmsConfig(
    propertyId: string,
    pmsConfig: AddPmsConfigDto,
  ): Promise<IProperty> {
    const property = await this.findOne(propertyId);

    // Check if a config for this provider already exists
    const existingConfigIndex = property.pmsConfigs.findIndex(
      (c) => c.provider === pmsConfig.provider,
    );

    if (existingConfigIndex !== -1) {
      // Update existing config
      property.pmsConfigs[existingConfigIndex] = {
        ...property.pmsConfigs[existingConfigIndex],
        ...pmsConfig,
        enabled:
          pmsConfig.enabled ?? property.pmsConfigs[existingConfigIndex].enabled,
      };
    } else {
      // Add new config
      property.pmsConfigs.push({
        ...pmsConfig,
        enabled: pmsConfig.enabled ?? true,
      } as PropertyPmsConfig);
    }

    return property.save();
  }

  /**
   * Update a PMS configuration for a property
   * @param propertyId - Property ID
   * @param provider - PMS provider name
   * @param updates - Partial PMS config updates
   * @returns Updated property document
   * @throws NotFoundException if property or config not found
   */
  async updatePmsConfig(
    propertyId: string,
    provider: string,
    updates: Partial<PropertyPmsConfig>,
  ): Promise<IProperty> {
    const property = await this.findOne(propertyId);

    const configIndex = property.pmsConfigs.findIndex(
      (c) => c.provider === provider,
    );

    if (configIndex === -1) {
      throw new NotFoundException(
        `PMS config for provider ${provider} not found in property ${propertyId}`,
      );
    }

    // Update the config while preserving the provider
    const currentConfig = property.pmsConfigs[configIndex];
    property.pmsConfigs[configIndex] = {
      provider: currentConfig.provider,
      externalPropertyId:
        updates.externalPropertyId ?? currentConfig.externalPropertyId,
      enabled: updates.enabled ?? currentConfig.enabled,
    };

    return property.save();
  }

  /**
   * Remove a PMS configuration from a property
   * @param propertyId - Property ID
   * @param provider - PMS provider name
   * @returns Updated property document
   * @throws NotFoundException if property not found
   */
  async removePmsConfig(
    propertyId: string,
    provider: string,
  ): Promise<IProperty> {
    const property = await this.findOne(propertyId);

    // Filter out the config for the specified provider
    property.pmsConfigs = property.pmsConfigs.filter(
      (c) => c.provider !== provider,
    );

    return property.save();
  }

  /**
   * Get all PMS configurations for a property
   * @param propertyId - Property ID
   * @returns Array of PMS configurations
   * @throws NotFoundException if property not found
   */
  async getAllPmsConfigs(propertyId: string): Promise<PropertyPmsConfig[]> {
    const property = await this.findOne(propertyId);
    return property.pmsConfigs || [];
  }
}
