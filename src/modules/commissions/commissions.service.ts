import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';


type TierRule = {
  id: string;
  minBookings: number;
  bonusRate: Decimal;
  commissionAgreementId: string;
  createdAt: Date;
};

@Injectable()
export class CommissionsService {
    constructor(private prisma: PrismaService) {}

    async calculateCommission(bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: {id: bookingId},
            include: {
                hotel: true,
                commissionCalculation: true
            }
        });

        if(!booking) {
            throw new NotFoundException(`Booking with ID ${bookingId} not found`);
        }

        if(booking.status !== 'COMPLETED') {
            throw new BadRequestException('Booking must be completed before calculating commission');
        }

        if(booking.commissionCalculation) {
            throw new BadRequestException('Commission already calculated for this booking');
        }

        const agreement = await this.findAgreementAtDate(booking.hotelId, booking.bookingDate);

        if(!agreement) {
            throw new NotFoundException(
                `No commission agreement found for hotel ${booking.hotelId} at ${booking.bookingDate}`
            );
        }

        let baseAmount: Decimal;
        let baseRate: Decimal | null = null;

        if (agreement.type === 'PERCENTAGE') {
            if (!agreement.baseRate) {
                throw new BadRequestException('PERCENTAGE agreement must have baseRate');
            }
            baseRate = agreement.baseRate;
            baseAmount = new Decimal(booking.amount).mul(agreement.baseRate);
        } else if (agreement.type === 'FLAT_FEE') {
            if (!agreement.flatAmount) {
                throw new BadRequestException('FLAT_FEE agreement must have flatAmount');
            }
            baseAmount = agreement.flatAmount;
        } else {
            throw new BadRequestException(`Unknown commission type: ${agreement.type}`);
        }

        let preferredBonusAmount: Decimal | null = null;
        if(booking.hotel.status === 'PREFERRED' && agreement.preferredBonus) {
            preferredBonusAmount = new Decimal(booking.amount).mul(agreement.preferredBonus);
        }

        let tierBonusAmount: Decimal | null = null;
        let appliedTierRule = null;

        if(agreement.tierRules && agreement.tierRules.length > 0 && booking.completedAt) {
            const monthlyCount = await this.getMonthlyCompletedBookingsCount(
                booking.hotelId,
                booking.completedAt
            );

            const applicableTier = agreement.tierRules.filter((rule: TierRule) => monthlyCount >= rule.minBookings).sort((a: TierRule, b: TierRule) => b.minBookings - a.minBookings)[0];

            if(applicableTier) {
                tierBonusAmount = new Decimal(booking.amount).mul(applicableTier.bonusRate);
                appliedTierRule = {
                    minBookings: applicableTier.minBookings,
                    bonusRate: applicableTier.bonusRate.toString()
                };
            }

        }

        const totalAmount = baseAmount.add(preferredBonusAmount || 0).add(tierBonusAmount || 0);

        const calculation = await this.prisma.commissionCalculation.create({
            data: {
                bookingId: booking.id,
                hotelId: booking.hotelId,
                commissionAgreementId: agreement.id,
                baseAmount,
                baseRate,
                preferredBonus: preferredBonusAmount,
                tierBonus: tierBonusAmount,
                totalAmount,
                calculationDetails: {
                    bookingAmount: booking.amount.toString(),
                    agreementType: agreement.type,
                    hotelStatus: booking.hotel.status,
                    monthlyBookingCount: appliedTierRule && booking.completedAt 
                        ? await this.getMonthlyCompletedBookingsCount(booking.hotelId, booking.completedAt) 
                        : 0,
                    appliedTierRule,
                    breakdown: `Base: ${baseAmount} + Preferred: ${preferredBonusAmount || 0} + Tier: ${tierBonusAmount || 0} = Total: ${totalAmount}`,
                }
            },
            include: {
                booking: true,
                hotel: true,
                commissionAgreement: {
                    include: {
                        tierRules: true
                    }
                }
            }
        });

        return calculation;
    }

    private async findAgreementAtDate(hotelId: string, date: Date) {
        return this.prisma.commissionAgreement.findFirst({
            where: {
                hotelId,
                validFrom: {lte: date},
                OR: [
                    {validTo: null},
                    {validTo: {gte: date}}
                ],
            },
            include: {
                tierRules: {
                    orderBy:{
                        minBookings: 'asc'
                    }
                }
            },
            orderBy: {
                validFrom: 'desc'
            },
        });
    }

    private async getMonthlyCompletedBookingsCount(hotelId: string, completedAt: Date): Promise<number> {
        const startOfMonth = new Date(completedAt.getFullYear(),completedAt.getMonth(), 1);
        const endOfMonth = new Date(completedAt.getFullYear(), completedAt.getMonth() + 1, 0, 23, 59, 59);

        return this.prisma.booking.count({
            where: {
                hotelId,
                status: 'COMPLETED',
                completedAt: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });
    }
}
