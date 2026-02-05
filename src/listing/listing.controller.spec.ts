import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ListingController } from './listing.controller';
import { ListingService } from './listing.service';

describe('ListingController', () => {
  let controller: ListingController;

  const mockListingModel = function (dto: any) {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto }),
    };
  } as any;

  mockListingModel.find = jest.fn();
  mockListingModel.findById = jest.fn();
  mockListingModel.findOne = jest.fn();
  mockListingModel.findByIdAndUpdate = jest.fn();
  mockListingModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingController],
      providers: [
        ListingService,
        {
          provide: getModelToken('Listing'),
          useValue: mockListingModel,
        },
      ],
    }).compile();

    controller = module.get<ListingController>(ListingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
