import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from '../../../node_modules/@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        await this.$connect();
        console.log('database connected');
    }
    async onModuleDestroy() {
        await this.$disconnect();
        console.log('database disconnected');
    }
}