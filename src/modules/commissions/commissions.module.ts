import { Module } from '@nestjs/common';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionsRepository } from './commissions.repository';
import { CommissionCalculator } from './commission.calculator';

@Module({
  controllers: [CommissionsController],
  providers: [
    CommissionsService,
    CommissionsRepository,
    CommissionCalculator,
  ],
  exports: [CommissionsService],
})
export class CommissionsModule {}