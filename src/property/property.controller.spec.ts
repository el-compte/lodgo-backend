import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PropertyController } from './property.controller';
import { PropertyService } from './property.service';

describe('PropertyController', () => {
  let controller: PropertyController;

  const mockPropertyModel = function (dto: any) {
    return {
      ...dto,
      save: jest.fn().mockResolvedValue({ ...dto }),
    };
  } as any;
  
  mockPropertyModel.find = jest.fn();
  mockPropertyModel.findById = jest.fn();
  mockPropertyModel.findOne = jest.fn();
  mockPropertyModel.findByIdAndUpdate = jest.fn();
  mockPropertyModel.findByIdAndDelete = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyController],
      providers: [
        PropertyService,
        {
          provide: getModelToken('Property'),
          useValue: mockPropertyModel,
        },
      ],
    }).compile();

    controller = module.get<PropertyController>(PropertyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
