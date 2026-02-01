import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingService } from './booking.service';
import { Booking, BookingSchema } from './entities/booking.entity';
import { TimeBlock, TimeBlockSchema } from './entities/timeblock.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: TimeBlock.name, schema: TimeBlockSchema },
    ]),
  ],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
