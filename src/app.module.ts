import { Module } from "@nestjs/common";
import { PrismaModule } from "./common/prisma/prisma.module";
import { HotelsModule } from './modules/hotels/hotels.module';

@Module({
    imports: [PrismaModule, HotelsModule],
    controllers: [],
    providers: []
})
export class AppModule {}