import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';

@Injectable()
export class HotelsService {
    constructor(private prisma: PrismaService) {}

    async create(createHotelDto: CreateHotelDto){
        const hotel = await this.prisma.hotel.create({
            data: createHotelDto,
        });

        return hotel;
    }

    async findAll() {
        return this.prisma.hotel.findMany({
            include: {
                commissionAgreements : {
                    where: { isActive: true },
                    include: {
                        tierRules: true,
                    },
                },
            }
        });
    }

    async findOne(id: string) {
        const hotel = await this.prisma.hotel.findUnique({
            where: { id },
            include: {
                commissionAgreements: {
                    where: { isActive: true },
                    include: {
                        tierRules: true
                    }
                }
            }
        });

        if(!hotel) {
            throw new NotFoundException(`Hotel with ID ${id} not found`);
        }

        return hotel;
    }

}
