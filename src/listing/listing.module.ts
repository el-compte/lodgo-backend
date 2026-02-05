import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ListingService } from './listing.service';
import { ListingController } from './listing.controller';
import { ListingSchema } from './entities/listing.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Listing', schema: ListingSchema }]),
  ],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [ListingService],
})
export class ListingModule {}
