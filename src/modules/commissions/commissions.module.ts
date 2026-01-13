import { Module } from '@nestjs/common';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { CommissionsRepository } from './commissions.repository';

@Module({
  controllers: [CommissionsController],
  providers: [CommissionsService, CommissionsRepository],
  exports: [CommissionsService]
})
export class CommissionsModule {}