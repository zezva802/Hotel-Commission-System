import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { CreateCommissionAgreementDto } from './dto/create-commission-agreement.dto';

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

    async createCommissionAgreement(hotelId: string, dto: CreateCommissionAgreementDto){
        await this.findOne(hotelId);

        const now = new Date();
        const validFrom = new Date(dto.validFrom);
        const isImmediatelyActive = validFrom <= now;

        if(isImmediatelyActive) {
            await this.prisma.commissionAgreement.updateMany({
                where: {
                    hotelId,
                    isActive: true,
                },
                data: {
                    isActive: false,
                    validTo: now
                }
            });
        }
        
        const agreement = await this.prisma.commissionAgreement.create({
            data: {
                hotelId,
                type: dto.type,
                baseRate: dto.baseRate,
                flatAmount: dto.flatAmount,
                preferredBonus: dto.preferredBonus,
                validFrom: validFrom,
                validTo: dto.validTo ? new Date(dto.validTo) : null,
                isActive: isImmediatelyActive,
                tierRules: dto.tierRules
                    ? {
                        create: dto.tierRules.map((rule) => ({
                            minBookings: rule.minBookings,
                            bonusRate: rule.bonusRate
                        })),
                    }
                    : undefined
            },
            include: {
                tierRules: true
            }
        });

        return agreement;

    }

    async getActiveCommissionAgreement(hotelId: string) {
        await this.findOne(hotelId);

        const now = new Date();

        const agreement = await this.prisma.commissionAgreement.findFirst({
            where: {
                hotelId,
                isActive: true,
            },
            include: {
                tierRules: {
                    orderBy: {
                        minBookings: 'asc'
                    }
                }
            }
        });

        if (!agreement) {
            throw new NotFoundException(`No active commission agreement found for hotel ${hotelId}`)
        }

        return agreement;
    }

}
