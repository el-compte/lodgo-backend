import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { PropertyService } from './property.service';
import { IProperty } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

describe('PropertyService', () => {
  let service: PropertyService;
  let model: Model<IProperty>;

  const mockProperty = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Property',
    address: '123 Test St',
    pmsConfigs: [
      {
        provider: 'hostaway',
        externalPropertyId: '12345',
        enabled: true,
      },
    ],
  };

  const mockPropertyModel = function (dto: any) {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, ...mockProperty }),
    };
  } as any;
  
  mockPropertyModel.find = jest.fn();
  mockPropertyModel.findById = jest.fn();
  mockPropertyModel.findOne = jest.fn();
  mockPropertyModel.findByIdAndUpdate = jest.fn();
  mockPropertyModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyService,
        {
          provide: getModelToken('Property'),
          useValue: mockPropertyModel,
        },
      ],
    }).compile();

    service = module.get<PropertyService>(PropertyService);
    model = module.get<Model<IProperty>>(getModelToken('Property'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new property', async () => {
      const createPropertyDto: CreatePropertyDto = {
        name: 'Test Property',
        address: '123 Test St',
        pmsConfigs: [
          {
            provider: 'hostaway',
            externalPropertyId: '12345',
            enabled: true,
          },
        ],
      };

      const result = await service.create(createPropertyDto);

      expect(result).toBeDefined();
      expect(result.name).toBe(createPropertyDto.name);
    });
  });

  describe('findAll', () => {
    it('should return an array of properties', async () => {
      const properties = [mockProperty];
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(properties),
      } as any);

      const result = await service.findAll();

      expect(result).toEqual(properties);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a property by ID', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProperty),
      } as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockProperty);
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when property not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.findOne('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a property', async () => {
      const updatePropertyDto: UpdatePropertyDto = {
        name: 'Updated Property',
      };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockProperty, ...updatePropertyDto }),
      } as any);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updatePropertyDto,
      );

      expect(result.name).toBe('Updated Property');
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updatePropertyDto,
        { new: true },
      );
    });

    it('should throw NotFoundException when property not found', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update('507f1f77bcf86cd799439011', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a property', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProperty),
      } as any);

      const result = await service.remove('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockProperty);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw NotFoundException when property not found', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.remove('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByExternalPropertyId', () => {
    it('should find a property by external property ID and provider', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockProperty),
      } as any);

      const result = await service.findByExternalPropertyId(
        'hostaway',
        '12345',
      );

      expect(result).toEqual(mockProperty);
      expect(model.findOne).toHaveBeenCalledWith({
        'pmsConfigs.provider': 'hostaway',
        'pmsConfigs.externalPropertyId': '12345',
      });
    });

    it('should return null when property not found', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.findByExternalPropertyId(
        'hostaway',
        '99999',
      );

      expect(result).toBeNull();
    });
  });

  describe('getPmsConfig', () => {
    it('should return PMS config for a provider', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProperty as any);

      const result = await service.getPmsConfig(
        '507f1f77bcf86cd799439011',
        'hostaway',
      );

      expect(result).toEqual(mockProperty.pmsConfigs[0]);
    });

    it('should return null when provider config not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProperty as any);

      const result = await service.getPmsConfig(
        '507f1f77bcf86cd799439011',
        'guesty',
      );

      expect(result).toBeNull();
    });

    it('should return null when property has no PMS configs', async () => {
      const propertyWithoutConfigs = {
        ...mockProperty,
        pmsConfigs: [],
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(propertyWithoutConfigs as any);

      const result = await service.getPmsConfig(
        '507f1f77bcf86cd799439011',
        'hostaway',
      );

      expect(result).toBeNull();
    });
  });

  describe('isPropertyEligibleForWebhook', () => {
    it('should return true for property with valid PMS config', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProperty as any);

      const result = await service.isPropertyEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(true);
    });

    it('should return false for property with no PMS configs', async () => {
      const propertyWithoutConfigs = {
        ...mockProperty,
        pmsConfigs: [],
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(propertyWithoutConfigs as any);

      const result = await service.isPropertyEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(false);
    });

    it('should return false for property with disabled PMS config', async () => {
      const propertyWithDisabledConfig = {
        ...mockProperty,
        pmsConfigs: [
          {
            provider: 'hostaway',
            externalPropertyId: '12345',
            enabled: false,
          },
        ],
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(propertyWithDisabledConfig as any);

      const result = await service.isPropertyEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(false);
    });

    it('should return false when property not found', async () => {
      jest
        .spyOn(service, 'findOne')
        .mockRejectedValue(new NotFoundException());

      const result = await service.isPropertyEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(false);
    });
  });

  describe('isPropertyEligibleForWebhookByExternalId', () => {
    it('should return true for eligible property', async () => {
      jest
        .spyOn(service, 'findByExternalPropertyId')
        .mockResolvedValue(mockProperty as any);

      const result = await service.isPropertyEligibleForWebhookByExternalId(
        'hostaway',
        '12345',
      );

      expect(result).toBe(true);
    });

    it('should return false when property not found', async () => {
      jest
        .spyOn(service, 'findByExternalPropertyId')
        .mockResolvedValue(null);

      const result = await service.isPropertyEligibleForWebhookByExternalId(
        'hostaway',
        '99999',
      );

      expect(result).toBe(false);
    });

    it('should return false when config is disabled', async () => {
      const propertyWithDisabledConfig = {
        ...mockProperty,
        pmsConfigs: [
          {
            provider: 'hostaway',
            externalPropertyId: '12345',
            enabled: false,
          },
        ],
      };
      jest
        .spyOn(service, 'findByExternalPropertyId')
        .mockResolvedValue(propertyWithDisabledConfig as any);

      const result = await service.isPropertyEligibleForWebhookByExternalId(
        'hostaway',
        '12345',
      );

      expect(result).toBe(false);
    });
  });

  describe('addPmsConfig', () => {
    it('should add a new PMS config to property', async () => {
      const propertyWithoutConfig = {
        ...mockProperty,
        pmsConfigs: [],
        save: jest.fn().mockResolvedValue({
          ...mockProperty,
          pmsConfigs: [
            {
              provider: 'guesty',
              externalPropertyId: '67890',
              enabled: true,
            },
          ],
        }),
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(propertyWithoutConfig as any);

      const newConfig = {
        provider: 'guesty' as const,
        externalPropertyId: '67890',
        enabled: true,
      };

      const result = await service.addPmsConfig(
        '507f1f77bcf86cd799439011',
        newConfig,
      );

      expect(propertyWithoutConfig.save).toHaveBeenCalled();
      expect(result.pmsConfigs).toHaveLength(1);
    });

    it('should update existing PMS config if provider already exists', async () => {
      const existingProperty = {
        ...mockProperty,
        save: jest.fn().mockResolvedValue({
          ...mockProperty,
          pmsConfigs: [
            {
              provider: 'hostaway',
              externalPropertyId: 'updated-12345',
              enabled: false,
            },
          ],
        }),
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(existingProperty as any);

      const updatedConfig = {
        provider: 'hostaway' as const,
        externalPropertyId: 'updated-12345',
        enabled: false,
      };

      const result = await service.addPmsConfig(
        '507f1f77bcf86cd799439011',
        updatedConfig,
      );

      expect(existingProperty.save).toHaveBeenCalled();
    });
  });

  describe('updatePmsConfig', () => {
    it('should update an existing PMS config', async () => {
      const existingProperty = {
        ...mockProperty,
        pmsConfigs: [
          {
            provider: 'hostaway',
            externalPropertyId: '12345',
            enabled: true,
          },
        ],
        save: jest.fn().mockResolvedValue({
          ...mockProperty,
          pmsConfigs: [
            {
              provider: 'hostaway',
              externalPropertyId: '12345',
              enabled: false,
            },
          ],
        }),
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(existingProperty as any);

      const result = await service.updatePmsConfig(
        '507f1f77bcf86cd799439011',
        'hostaway',
        { enabled: false },
      );

      expect(existingProperty.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when config not found', async () => {
      const propertyWithoutConfig = {
        ...mockProperty,
        pmsConfigs: [],
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(propertyWithoutConfig as any);

      await expect(
        service.updatePmsConfig('507f1f77bcf86cd799439011', 'hostaway', {
          enabled: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removePmsConfig', () => {
    it('should remove a PMS config from property', async () => {
      const existingProperty = {
        ...mockProperty,
        pmsConfigs: [
          {
            provider: 'hostaway',
            externalPropertyId: '12345',
            enabled: true,
          },
          {
            provider: 'guesty',
            externalPropertyId: '67890',
            enabled: true,
          },
        ],
        save: jest.fn().mockResolvedValue({
          ...mockProperty,
          pmsConfigs: [
            {
              provider: 'guesty',
              externalPropertyId: '67890',
              enabled: true,
            },
          ],
        }),
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(existingProperty as any);

      const result = await service.removePmsConfig(
        '507f1f77bcf86cd799439011',
        'hostaway',
      );

      expect(existingProperty.save).toHaveBeenCalled();
      expect(result.pmsConfigs).toHaveLength(1);
    });
  });

  describe('getAllPmsConfigs', () => {
    it('should return all PMS configs for a property', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockProperty as any);

      const result = await service.getAllPmsConfigs('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockProperty.pmsConfigs);
    });

    it('should return empty array when property has no configs', async () => {
      const propertyWithoutConfigs = {
        ...mockProperty,
        pmsConfigs: [],
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(propertyWithoutConfigs as any);

      const result = await service.getAllPmsConfigs('507f1f77bcf86cd799439011');

      expect(result).toEqual([]);
    });
  });
});
