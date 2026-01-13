import { forwardRef, Module } from '@nestjs/common';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { BookingsModule } from '../bookings/bookings.module';

@Module({
  imports: [forwardRef(() => BookingsModule)],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService]
})
export class CommissionsModule {}
