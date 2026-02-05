import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotFoundException } from '@nestjs/common';
import { ListingService } from './listing.service';
import { IListing } from './entities/listing.entity';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';

describe('ListingService', () => {
  let service: ListingService;
  let model: Model<IListing>;

  const mockListing = {
    _id: '507f1f77bcf86cd799439011',
    title: 'Test Listing',
    description: 'Test Description',
    location: {
      city: 'Test City',
      country: 'Test Country',
    },
    capacity: {
      guests: 4,
      bedrooms: 2,
    },
    pricing: {
      basePrice: 100,
      currency: 'USD',
    },
    checkInOut: {
      checkInStart: 14,
      checkOutTime: 10,
    },
    policies: {},
    contact: [],
    images: [],
    beds: [],
    pms: {
      provider: 'hostaway',
      externalPropertyId: '12345',
      enabled: true,
    },
  };

  const mockListingModel = function (dto: any) {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto, ...mockListing }),
    };
  } as any;

  mockListingModel.find = jest.fn();
  mockListingModel.findById = jest.fn();
  mockListingModel.findOne = jest.fn();
  mockListingModel.findByIdAndUpdate = jest.fn();
  mockListingModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingService,
        {
          provide: getModelToken('Listing'),
          useValue: mockListingModel,
        },
      ],
    }).compile();

    service = module.get<ListingService>(ListingService);
    model = module.get<Model<IListing>>(getModelToken('Listing'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new listing', async () => {
      const createListingDto: CreateListingDto = {
        title: 'Test Listing',
        location: { city: 'Test City' },
        capacity: {},
        pricing: {},
        checkInOut: {},
        policies: {},
        contact: [],
        images: [],
        beds: [],
        pms: {
          provider: 'hostaway',
          externalPropertyId: '12345',
          enabled: true,
        },
      };

      const result = await service.create(createListingDto);

      expect(result).toBeDefined();
      expect(result.title).toBe(createListingDto.title);
    });
  });

  describe('findAll', () => {
    it('should return an array of properties', async () => {
      const properties = [mockListing];
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValue(properties),
      } as any);

      const result = await service.findAll();

      expect(result).toEqual(properties);
      expect(model.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a listing by ID', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockListing),
      } as any);

      const result = await service.findOne('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockListing);
      expect(model.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });

    it('should throw NotFoundException when listing not found', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.findOne('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a listing', async () => {
      const updateListingDto: UpdateListingDto = {
        name: 'Updated Listing',
      };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest
          .fn()
          .mockResolvedValue({ ...mockListing, ...updateListingDto }),
      } as any);

      const result = await service.update(
        '507f1f77bcf86cd799439011',
        updateListingDto,
      );

      expect(result.name).toBe('Updated Listing');
      expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        updateListingDto,
        { new: true },
      );
    });

    it('should throw NotFoundException when listing not found', async () => {
      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update('507f1f77bcf86cd799439011', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a listing', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockListing),
      } as any);

      const result = await service.remove('507f1f77bcf86cd799439011');

      expect(result).toEqual(mockListing);
      expect(model.findByIdAndDelete).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
      );
    });

    it('should throw NotFoundException when listing not found', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.remove('507f1f77bcf86cd799439011')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByExternalPropertyId', () => {
    it('should find a listing by external property ID and provider', async () => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockListing),
      } as any);

      const result = await service.findByExternalPropertyId(
        'hostaway',
        '12345',
      );

      expect(result).toEqual(mockListing);
      expect(model.findOne).toHaveBeenCalledWith({
        'pms.provider': 'hostaway',
        'pms.externalPropertyId': '12345',
      });
    });

    it('should return null when listing not found', async () => {
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
    it('should return PMS config', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockListing as any);

      const result = await service.getPmsConfig(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toEqual(mockListing.pms);
    });

    it('should return null when listing has no PMS config', async () => {
      const listingWithoutConfig = {
        ...mockListing,
        pms: null,
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(listingWithoutConfig as any);

      const result = await service.getPmsConfig(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBeNull();
    });
  });

  describe('isListingEligibleForWebhook', () => {
    it('should return true for listing with valid PMS config', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockListing as any);

      const result = await service.isListingEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(true);
    });

    it('should return false for listing with no PMS config', async () => {
      const listingWithoutConfig = {
        ...mockListing,
        pms: null,
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(listingWithoutConfig as any);

      const result = await service.isListingEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(false);
    });

    it('should return false for listing with disabled PMS config', async () => {
      const listingWithDisabledConfig = {
        ...mockListing,
        pms: {
          provider: 'hostaway',
          externalPropertyId: '12345',
          enabled: false,
        },
      };
      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(listingWithDisabledConfig as any);

      const result = await service.isListingEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(false);
    });

    it('should return false when listing not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      const result = await service.isListingEligibleForWebhook(
        '507f1f77bcf86cd799439011',
      );

      expect(result).toBe(false);
    });
  });

  describe('isListingEligibleForWebhookByExternalId', () => {
    it('should return true for eligible listing', async () => {
      jest
        .spyOn(service, 'findByExternalPropertyId')
        .mockResolvedValue(mockListing as any);

      const result = await service.isListingEligibleForWebhookByExternalId(
        'hostaway',
        '12345',
      );

      expect(result).toBe(true);
    });

    it('should return false when listing not found', async () => {
      jest.spyOn(service, 'findByExternalPropertyId').mockResolvedValue(null);

      const result = await service.isListingEligibleForWebhookByExternalId(
        'hostaway',
        '99999',
      );

      expect(result).toBe(false);
    });

    it('should return false when config is disabled', async () => {
      const listingWithDisabledConfig = {
        ...mockListing,
        pms: {
          provider: 'hostaway',
          externalPropertyId: '12345',
          enabled: false,
        },
      };
      jest
        .spyOn(service, 'findByExternalPropertyId')
        .mockResolvedValue(listingWithDisabledConfig as any);

      const result = await service.isListingEligibleForWebhookByExternalId(
        'hostaway',
        '12345',
      );

      expect(result).toBe(false);
    });
  });

  describe('setPmsConfig', () => {
    it('should set PMS config for listing', async () => {
      const listingWithoutConfig = {
        ...mockListing,
        pms: null,
        save: jest.fn().mockResolvedValue({
          ...mockListing,
          pms: {
            provider: 'guesty',
            externalPropertyId: '67890',
            enabled: true,
          },
        }),
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(listingWithoutConfig as any);

      const newConfig = {
        provider: 'guesty' as const,
        externalPropertyId: '67890',
        enabled: true,
      };

      const result = await service.setPmsConfig(
        '507f1f77bcf86cd799439011',
        newConfig,
      );

      expect(listingWithoutConfig.save).toHaveBeenCalled();
      expect(result.pms).toBeDefined();
      expect(result.pms.provider).toBe('guesty');
    });
  });

  describe('updatePmsConfig', () => {
    it('should update existing PMS config', async () => {
      const existingListing = {
        ...mockListing,
        pms: {
          provider: 'hostaway',
          externalPropertyId: '12345',
          enabled: true,
        },
        save: jest.fn().mockResolvedValue({
          ...mockListing,
          pms: {
            provider: 'hostaway',
            externalPropertyId: '12345',
            enabled: false,
          },
        }),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingListing as any);

      const result = await service.updatePmsConfig(
        '507f1f77bcf86cd799439011',
        { enabled: false },
      );

      expect(existingListing.save).toHaveBeenCalled();
      expect(result.pms.enabled).toBe(false);
    });

    it('should throw NotFoundException when config not found', async () => {
      const listingWithoutConfig = {
        ...mockListing,
        pms: null,
      };

      jest
        .spyOn(service, 'findOne')
        .mockResolvedValue(listingWithoutConfig as any);

      await expect(
        service.updatePmsConfig('507f1f77bcf86cd799439011', {
          enabled: false,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removePmsConfig', () => {
    it('should remove PMS config from listing', async () => {
      const existingListing = {
        ...mockListing,
        pms: {
          provider: 'hostaway',
          externalPropertyId: '12345',
          enabled: true,
        },
        save: jest.fn().mockResolvedValue({
          ...mockListing,
          pms: null,
        }),
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingListing as any);

      const result = await service.removePmsConfig(
        '507f1f77bcf86cd799439011',
      );

      expect(existingListing.save).toHaveBeenCalled();
      expect(result.pms).toBeNull();
    });
  });
});
