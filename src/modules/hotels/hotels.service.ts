import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { CreateCommissionAgreementDto } from './dto/create-commission-agreement.dto';
import { HotelsRepository } from './hotels.repository';

@Injectable()
export class HotelsService {
    constructor(private repository: HotelsRepository) {}

    async create(createHotelDto: CreateHotelDto) {
        return this.repository.create(createHotelDto);
    }

    async findAll() {
        return this.repository.findAll();
    }

    async findOne(id: string) {
        const hotel = await this.repository.findById(id);

        if (!hotel) {
            throw new NotFoundException(`Hotel with ID ${id} not found`);
        }

        return hotel;
    }

    async createCommissionAgreement(hotelId: string, dto: CreateCommissionAgreementDto) {
        await this.findOne(hotelId);

        const now = new Date();
        const validFrom = new Date(dto.validFrom);
        const isImmediatelyActive = validFrom <= now;

        if (isImmediatelyActive) {
            await this.repository.deactivateAgreements(hotelId, now);
        }

        return this.repository.createAgreement({
            hotelId,
            type: dto.type,
            baseRate: dto.baseRate,
            flatAmount: dto.flatAmount,
            preferredBonus: dto.preferredBonus,
            validFrom,
            validTo: dto.validTo ? new Date(dto.validTo) : null,
            isActive: isImmediatelyActive,
            tierRules: dto.tierRules
                ? {
                    create: dto.tierRules.map((rule) => ({
                        minBookings: rule.minBookings,
                        bonusRate: rule.bonusRate,
                    })),
                }
                : undefined,
        });
    }

    async getActiveCommissionAgreement(hotelId: string) {
        await this.findOne(hotelId);

        const agreement = await this.repository.findActiveAgreement(hotelId);

        if (!agreement) {
            throw new NotFoundException(`No active commission agreement found for hotel ${hotelId}`);
        }

        return agreement;
    }
}