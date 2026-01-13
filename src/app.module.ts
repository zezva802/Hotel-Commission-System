import { Module } from "@nestjs/common";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HotelsModule } from './modules/hotels/hotels.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { CommissionsModule } from './modules/commissions/commissions.module';

@Module({
    imports: [PrismaModule, HotelsModule, BookingsModule, CommissionsModule],
    controllers: [],
    providers: []
})
export class AppModule {}