import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { HostawayWebhookService } from './hostaway-webhook.service';
import { PropertyService } from '../../property/property.service';
import { HostawayWebhookDto } from './dto/hostaway-webhook.dto';

describe('HostawayWebhookService', () => {
  let service: HostawayWebhookService;

  const mockPropertyService = {
    findByExternalPropertyId: jest.fn(),
    isPropertyEligibleForWebhookByExternalId: jest.fn(),
    findOne: jest.fn(),
  };

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HostawayWebhookService,
        {
          provide: PropertyService,
          useValue: mockPropertyService,
        },
      ],
    }).compile();

    service = module.get<HostawayWebhookService>(HostawayWebhookService);

    // Mock logger to avoid console output during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('handleWebhook', () => {
    it('should handle listing.updated event', async () => {
      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: {
          id: '12345',
          name: 'Test Listing',
          address: '123 Test St',
          externalListingName: 'Test External',
          price: 100,
          guestsIncluded: 2,
          currencyCode: 'USD',
          personCapacity: 4,
          lat: 40.7128,
          lng: -74.006,
          specialStatus: 'completed',
        },
      };

      mockPropertyService.findByExternalPropertyId.mockResolvedValue(
        mockProperty,
      );
      mockPropertyService.isPropertyEligibleForWebhookByExternalId.mockResolvedValue(
        true,
      );

      await service.handleWebhook(payload);

      expect(mockPropertyService.findByExternalPropertyId).toHaveBeenCalledWith(
        'hostaway',
        '12345',
      );
      expect(
        mockPropertyService.isPropertyEligibleForWebhookByExternalId,
      ).toHaveBeenCalledWith('hostaway', '12345');
    });

    it('should warn on unhandled event', async () => {
      const payload: HostawayWebhookDto = {
        event: 'unknown.event',
        data: {},
      };

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      await service.handleWebhook(payload);

      expect(warnSpy).toHaveBeenCalledWith(
        'Unhandled Hostaway event: unknown.event',
      );
    });

    it('should handle reservation.created event', async () => {
      const payload: HostawayWebhookDto = {
        event: 'reservation.created',
        data: { id: '123' },
      };

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      await service.handleWebhook(payload);

      expect(logSpy).toHaveBeenCalledWith('Reservation created', {
        id: '123',
      });
    });
  });

  describe('handleListingUpdated - PMS Config Validation', () => {
    const validListingData = {
      id: '12345',
      name: 'Test Listing',
      address: '123 Test St',
      externalListingName: 'Test External',
      price: 100,
      guestsIncluded: 2,
      currencyCode: 'USD',
      personCapacity: 4,
      lat: 40.7128,
      lng: -74.006,
      specialStatus: 'completed',
    };

    it('should process webhook for eligible property', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(
        mockProperty,
      );
      mockPropertyService.isPropertyEligibleForWebhookByExternalId.mockResolvedValue(
        true,
      );

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: validListingData,
      };

      await service.handleWebhook(payload);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('is eligible for webhook processing'),
      );
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully processing webhook'),
      );
    });

    it('should ignore webhook when property not found (no PMS config)', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(null);

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: validListingData,
      };

      await service.handleWebhook(payload);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('not found - ignoring webhook (no PMS config)'),
      );
      expect(
        mockPropertyService.isPropertyEligibleForWebhookByExternalId,
      ).not.toHaveBeenCalled();
    });

    it('should ignore webhook when PMS config is disabled', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(
        mockProperty,
      );
      mockPropertyService.isPropertyEligibleForWebhookByExternalId.mockResolvedValue(
        false,
      );

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: validListingData,
      };

      await service.handleWebhook(payload);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'is not eligible for webhook processing - PMS config disabled or invalid',
        ),
      );
    });

    it('should warn when external property ID is missing', async () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: {
          name: 'Test',
        },
      };

      await service.handleWebhook(payload);

      expect(warnSpy).toHaveBeenCalledWith(
        'External property ID missing in webhook payload',
      );
      expect(
        mockPropertyService.findByExternalPropertyId,
      ).not.toHaveBeenCalled();
    });

    it('should warn when listing data validation fails', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(
        mockProperty,
      );
      mockPropertyService.isPropertyEligibleForWebhookByExternalId.mockResolvedValue(
        true,
      );

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: {
          id: '12345',
          // Missing required fields
        },
      };

      await service.handleWebhook(payload);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Listing data validation failed'),
      );
    });

    it('should validate all required listing fields', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(
        mockProperty,
      );
      mockPropertyService.isPropertyEligibleForWebhookByExternalId.mockResolvedValue(
        true,
      );

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      const incompleteData = {
        id: '12345',
        name: 'Test',
        // Missing other required fields
      };

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: incompleteData,
      };

      await service.handleWebhook(payload);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Missing required field'),
      );
    });

    it('should reject listing with incomplete status', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(
        mockProperty,
      );
      mockPropertyService.isPropertyEligibleForWebhookByExternalId.mockResolvedValue(
        true,
      );

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: {
          ...validListingData,
          specialStatus: 'incomplete',
        },
      };

      await service.handleWebhook(payload);

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Listing status is not completed'),
      );
    });
  });

  describe('Acceptance Criteria: Properties without PMS config are ignored', () => {
    it('should ignore properties without PMS configuration', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(null);

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: {
          id: '99999',
          name: 'Test',
          address: 'Test',
          externalListingName: 'Test',
          price: 100,
          guestsIncluded: 2,
          currencyCode: 'USD',
          personCapacity: 4,
          lat: 40.7128,
          lng: -74.006,
          specialStatus: 'completed',
        },
      };

      await service.handleWebhook(payload);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('not found - ignoring webhook (no PMS config)'),
      );
    });

    it('should log ignored properties for monitoring', async () => {
      mockPropertyService.findByExternalPropertyId.mockResolvedValue(null);

      const logSpy = jest.spyOn(Logger.prototype, 'log');

      const payload: HostawayWebhookDto = {
        event: 'listing.updated',
        data: { id: '12345' },
      };

      await service.handleWebhook(payload);

      expect(logSpy).toHaveBeenCalled();
      const logMessages = logSpy.mock.calls.map((call) => call[0] as string);
      expect(
        logMessages.some((msg) => msg.includes('not found - ignoring webhook')),
      ).toBe(true);
    });
  });
});
