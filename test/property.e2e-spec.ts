import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IProperty } from '../src/listing/entities/property.entity';
import { PropertyPmsConfig } from '../src/listing/entities/pms-config.entity';
import type { Server } from 'node:http';

interface PropertyResponse {
  _id: string;
  name: string;
  address?: string;
  pmsConfigs: PropertyPmsConfig[];
  createdAt: string;
  updatedAt: string;
}

interface WebhookEligibilityResponse {
  eligible: boolean;
  propertyId: string;
}

describe('Property E2E Tests', () => {
  let app: INestApplication;
  let propertyModel: Model<IProperty>;
  let createdPropertyId: string;
  let httpServer: Server;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    httpServer = app.getHttpServer() as Server;

    propertyModel = moduleFixture.get<Model<IProperty>>(
      getModelToken('Property'),
    );
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdPropertyId) {
      await propertyModel.findByIdAndDelete(createdPropertyId);
    }
    await app.close();
  });

  describe('POST /property - Create property with PMS config', () => {
    it('should create a property with Hostaway PMS config', async () => {
      const createPropertyDto = {
        name: 'E2E Test Property',
        address: '123 E2E Test Street',
        pmsConfigs: [
          {
            provider: 'hostaway',
            externalPropertyId: 'e2e-hostaway-12345',
            enabled: true,
          },
        ],
      };

      const response = await request(httpServer)
        .post('/property')
        .send(createPropertyDto)
        .expect(201);

      const body = response.body as PropertyResponse;
      expect(body).toBeDefined();
      expect(body.name).toBe(createPropertyDto.name);
      expect(body.address).toBe(createPropertyDto.address);
      expect(body.pmsConfigs).toHaveLength(1);
      expect(body.pmsConfigs[0].provider).toBe('hostaway');
      expect(body.pmsConfigs[0].externalPropertyId).toBe('e2e-hostaway-12345');
      expect(body.pmsConfigs[0].enabled).toBe(true);

      // Store ID for cleanup and other tests
      createdPropertyId = body._id;
    });

    it('should create a property with multiple PMS configs', async () => {
      const createPropertyDto = {
        name: 'Multi-PMS Property',
        address: '456 Multi-PMS Street',
        pmsConfigs: [
          {
            provider: 'hostaway',
            externalPropertyId: 'multi-hostaway-123',
            enabled: true,
          },
          {
            provider: 'guesty',
            externalPropertyId: 'multi-guesty-456',
            enabled: true,
          },
        ],
      };

      const response = await request(httpServer)
        .post('/property')
        .send(createPropertyDto)
        .expect(201);

      const body = response.body as PropertyResponse;
      expect(body.pmsConfigs).toHaveLength(2);
      expect(body.pmsConfigs[0].provider).toBe('hostaway');
      expect(body.pmsConfigs[1].provider).toBe('guesty');

      // Clean up
      await propertyModel.findByIdAndDelete(body._id);
    });

    it('should reject invalid provider', async () => {
      const invalidDto = {
        name: 'Invalid Provider Property',
        address: '789 Invalid Street',
        pmsConfigs: [
          {
            provider: 'invalid-provider',
            externalPropertyId: 'test-123',
            enabled: true,
          },
        ],
      };

      await request(httpServer).post('/property').send(invalidDto).expect(400);
    });

    it('should reject missing externalPropertyId', async () => {
      const invalidDto = {
        name: 'Missing ID Property',
        address: '111 Missing Street',
        pmsConfigs: [
          {
            provider: 'hostaway',
            enabled: true,
          },
        ],
      };

      await request(httpServer).post('/property').send(invalidDto).expect(400);
    });
  });

  describe('POST /property/:id/pms-config - Add PMS config to existing property', () => {
    it('should add a Guesty PMS config to existing property', async () => {
      const addConfigDto = {
        provider: 'guesty',
        externalPropertyId: 'e2e-guesty-67890',
        enabled: true,
      };

      const response = await request(httpServer)
        .post(`/property/${createdPropertyId}/pms-config`)
        .send(addConfigDto)
        .expect(201);

      const body = response.body as PropertyResponse;
      expect(body.pmsConfigs).toBeDefined();
      const guestyConfig = body.pmsConfigs.find(
        (config) => config.provider === 'guesty',
      );
      expect(guestyConfig).toBeDefined();
      expect(guestyConfig?.externalPropertyId).toBe('e2e-guesty-67890');
      expect(guestyConfig?.enabled).toBe(true);
    });

    it('should update existing PMS config if provider already exists', async () => {
      const updateConfigDto = {
        provider: 'hostaway',
        externalPropertyId: 'updated-hostaway-99999',
        enabled: false,
      };

      const response = await request(httpServer)
        .post(`/property/${createdPropertyId}/pms-config`)
        .send(updateConfigDto)
        .expect(201);

      const body = response.body as PropertyResponse;
      const hostawayConfig = body.pmsConfigs.find(
        (config) => config.provider === 'hostaway',
      );
      expect(hostawayConfig?.externalPropertyId).toBe('updated-hostaway-99999');
      expect(hostawayConfig?.enabled).toBe(false);
    });

    it('should return 404 for non-existent property', async () => {
      const addConfigDto = {
        provider: 'hostaway',
        externalPropertyId: 'test-123',
        enabled: true,
      };

      await request(httpServer)
        .post('/property/507f1f77bcf86cd799439011/pms-config')
        .send(addConfigDto)
        .expect(404);
    });
  });

  describe('GET /property/:id/pms-config - Get all PMS configs', () => {
    it('should return all PMS configs for a property', async () => {
      const response = await request(httpServer)
        .get(`/property/${createdPropertyId}/pms-config`)
        .expect(200);

      const body = response.body as PropertyPmsConfig[];
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(2);
      expect(body.every((config) => config.provider)).toBe(true);
      expect(body.every((config) => config.externalPropertyId)).toBe(true);
    });

    it('should return 404 for non-existent property', async () => {
      await request(httpServer)
        .get('/property/507f1f77bcf86cd799439011/pms-config')
        .expect(404);
    });
  });

  describe('PATCH /property/:id/pms-config/:provider - Update PMS config', () => {
    it('should update Guesty PMS config', async () => {
      const updateDto = {
        externalPropertyId: 'updated-guesty-11111',
        enabled: false,
      };

      const response = await request(httpServer)
        .patch(`/property/${createdPropertyId}/pms-config/guesty`)
        .send(updateDto)
        .expect(200);

      const body = response.body as PropertyResponse;
      const guestyConfig = body.pmsConfigs.find(
        (config) => config.provider === 'guesty',
      );
      expect(guestyConfig?.externalPropertyId).toBe('updated-guesty-11111');
      expect(guestyConfig?.enabled).toBe(false);
    });

    it('should return 404 when PMS config not found', async () => {
      const updateDto = {
        externalPropertyId: 'test-123',
        enabled: true,
      };

      await request(httpServer)
        .patch(`/property/${createdPropertyId}/pms-config/non-existent`)
        .send(updateDto)
        .expect(404);
    });
  });

  describe('GET /property/:id/webhook-eligibility - Check webhook eligibility', () => {
    beforeAll(async () => {
      // Re-enable Hostaway config for eligibility tests
      await request(httpServer)
        .patch(`/property/${createdPropertyId}/pms-config/hostaway`)
        .send({
          externalPropertyId: 'e2e-hostaway-12345',
          enabled: true,
        });
    });

    it('should return eligible when property has enabled PMS config', async () => {
      const response = await request(httpServer)
        .get(`/property/${createdPropertyId}/webhook-eligibility`)
        .expect(200);

      const body = response.body as WebhookEligibilityResponse;
      expect(body.eligible).toBe(true);
      expect(body.propertyId).toBe(createdPropertyId);
    });

    it('should return not eligible when all configs are disabled', async () => {
      // Disable all configs
      await request(httpServer)
        .patch(`/property/${createdPropertyId}/pms-config/hostaway`)
        .send({ enabled: false });
      await request(httpServer)
        .patch(`/property/${createdPropertyId}/pms-config/guesty`)
        .send({ enabled: false });

      const response = await request(httpServer)
        .get(`/property/${createdPropertyId}/webhook-eligibility`)
        .expect(200);

      const body = response.body as WebhookEligibilityResponse;
      expect(body.eligible).toBe(false);
      expect(body.propertyId).toBe(createdPropertyId);

      // Re-enable for other tests
      await request(httpServer)
        .patch(`/property/${createdPropertyId}/pms-config/hostaway`)
        .send({ enabled: true });
    });

    it('should return not eligible for non-existent property', async () => {
      const response = await request(httpServer)
        .get('/property/507f1f77bcf86cd799439011/webhook-eligibility')
        .expect(200);

      const body = response.body as WebhookEligibilityResponse;
      expect(body.eligible).toBe(false);
    });
  });

  describe('DELETE /property/:id/pms-config/:provider - Delete PMS config', () => {
    it('should remove Guesty PMS config from property', async () => {
      const response = await request(httpServer)
        .delete(`/property/${createdPropertyId}/pms-config/guesty`)
        .expect(200);

      const body = response.body as PropertyResponse;
      expect(body.pmsConfigs).toBeDefined();
      const guestyConfig = body.pmsConfigs.find(
        (config) => config.provider === 'guesty',
      );
      expect(guestyConfig).toBeUndefined();
    });

    it('should return 404 for non-existent property', async () => {
      await request(httpServer)
        .delete('/property/507f1f77bcf86cd799439011/pms-config/hostaway')
        .expect(404);
    });
  });

  describe('Multiple PMS Providers on Same Property', () => {
    let multiPmsPropertyId: string;

    beforeAll(async () => {
      // Create a property with no PMS configs
      const createDto = {
        name: 'Multi-Provider Test Property',
        address: '999 Multi-Provider Ave',
      };

      const response = await request(httpServer)
        .post('/property')
        .send(createDto)
        .expect(201);

      const body = response.body as PropertyResponse;
      multiPmsPropertyId = body._id;
    });

    afterAll(async () => {
      if (multiPmsPropertyId) {
        await propertyModel.findByIdAndDelete(multiPmsPropertyId);
      }
    });

    it('should add Hostaway PMS config', async () => {
      const response = await request(httpServer)
        .post(`/property/${multiPmsPropertyId}/pms-config`)
        .send({
          provider: 'hostaway',
          externalPropertyId: 'multi-hostaway-123',
          enabled: true,
        })
        .expect(201);

      const body = response.body as PropertyResponse;
      expect(body.pmsConfigs).toHaveLength(1);
      expect(body.pmsConfigs[0].provider).toBe('hostaway');
    });

    it('should add Guesty PMS config alongside Hostaway', async () => {
      const response = await request(httpServer)
        .post(`/property/${multiPmsPropertyId}/pms-config`)
        .send({
          provider: 'guesty',
          externalPropertyId: 'multi-guesty-456',
          enabled: true,
        })
        .expect(201);

      const body = response.body as PropertyResponse;
      expect(body.pmsConfigs).toHaveLength(2);
      const providers = body.pmsConfigs.map((c) => c.provider);
      expect(providers).toContain('hostaway');
      expect(providers).toContain('guesty');
    });

    it('should be able to disable one provider while keeping the other', async () => {
      await request(httpServer)
        .patch(`/property/${multiPmsPropertyId}/pms-config/hostaway`)
        .send({ enabled: false })
        .expect(200);

      const response = await request(httpServer)
        .get(`/property/${multiPmsPropertyId}/pms-config`)
        .expect(200);

      const body = response.body as PropertyPmsConfig[];
      const hostawayConfig = body.find((c) => c.provider === 'hostaway');
      const guestyConfig = body.find((c) => c.provider === 'guesty');

      expect(hostawayConfig?.enabled).toBe(false);
      expect(guestyConfig?.enabled).toBe(true);
    });

    it('should be able to update external IDs independently', async () => {
      await request(httpServer)
        .patch(`/property/${multiPmsPropertyId}/pms-config/hostaway`)
        .send({
          externalPropertyId: 'new-hostaway-789',
          enabled: true,
        })
        .expect(200);

      await request(httpServer)
        .patch(`/property/${multiPmsPropertyId}/pms-config/guesty`)
        .send({
          externalPropertyId: 'new-guesty-101',
        })
        .expect(200);

      const response = await request(httpServer)
        .get(`/property/${multiPmsPropertyId}/pms-config`)
        .expect(200);

      const body = response.body as PropertyPmsConfig[];
      const hostawayConfig = body.find((c) => c.provider === 'hostaway');
      const guestyConfig = body.find((c) => c.provider === 'guesty');

      expect(hostawayConfig?.externalPropertyId).toBe('new-hostaway-789');
      expect(guestyConfig?.externalPropertyId).toBe('new-guesty-101');
    });

    it('should remain eligible for webhooks with at least one enabled config', async () => {
      // Disable Hostaway, keep Guesty enabled
      await request(httpServer)
        .patch(`/property/${multiPmsPropertyId}/pms-config/hostaway`)
        .send({ enabled: false });

      const response = await request(httpServer)
        .get(`/property/${multiPmsPropertyId}/webhook-eligibility`)
        .expect(200);

      const body = response.body as WebhookEligibilityResponse;
      expect(body.eligible).toBe(true);
    });

    it('should be able to remove configs individually', async () => {
      // Remove Hostaway
      await request(httpServer)
        .delete(`/property/${multiPmsPropertyId}/pms-config/hostaway`)
        .expect(200);

      let response = await request(httpServer)
        .get(`/property/${multiPmsPropertyId}/pms-config`)
        .expect(200);

      let body = response.body as PropertyPmsConfig[];
      expect(body).toHaveLength(1);
      expect(body[0].provider).toBe('guesty');

      // Remove Guesty
      await request(httpServer)
        .delete(`/property/${multiPmsPropertyId}/pms-config/guesty`)
        .expect(200);

      response = await request(httpServer)
        .get(`/property/${multiPmsPropertyId}/pms-config`)
        .expect(200);

      body = response.body as PropertyPmsConfig[];
      expect(body).toHaveLength(0);
    });
  });
});
