import { Module } from '@nestjs/common';
import { HotelsController } from './hotels.controller';
import { HotelsService } from './hotels.service';
import { HotelsRepository } from './hotels.repository';

@Module({
  controllers: [HotelsController],
  providers: [HotelsService, HotelsRepository],
})
export class HotelsModule {}