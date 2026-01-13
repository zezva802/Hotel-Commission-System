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

        if (!booking.completedAt) {
            throw new BadRequestException('Booking has no completion date');
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

        let monthlyCount = 0;
        if (agreement.tierRules && agreement.tierRules.length > 0) {
            monthlyCount = await this.getMonthlyCompletedBookingsCount(
                booking.hotelId,
                booking.completedAt
            );

            const applicableTier = agreement.tierRules.filter((rule: TierRule) => monthlyCount >= rule.minBookings)[0];

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
                    monthlyBookingCount: monthlyCount,
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
                        minBookings: 'desc'
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

        return this.prisma.booking.count({
            where: {
                hotelId,
                status: 'COMPLETED',
                completedAt: {
                    gte: startOfMonth,
                    lt: completedAt
                }
            }
        });
    }

    async getMonthlySummary(month: string) {
        const [year, monthNum] = month.split('-').map(Number);

        if(!year || !monthNum || monthNum < 1 || monthNum > 12) {
            throw new BadRequestException('Invalid month format. Use YYYY-MM');
        }

        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        const calculations = await this.prisma.commissionCalculation.findMany({
            where: {
                calculatedAt: {
                    gte: startDate,
                    lte: endDate
                },
            },
            include: {
                hotel: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                },
                booking: {
                    select: {
                        id: true,
                        amount: true
                    }
                }
            },
            orderBy: {
                calculatedAt: 'asc'
            }
        });

        const hotelSummaries = new Map<string, {
            hotelId: string;
            hotelName: string;
            hotelStatus: string;
            totalCommission: Decimal;
            bookingCount: number;
            calculations: any[];
        }>();

        for (const calc of calculations) {
            const hotelId = calc.hotel.id;
            if(!hotelSummaries.has(hotelId)) {
                hotelSummaries.set(hotelId, {
                    hotelId: calc.hotel.id,
                    hotelName: calc.hotel.name,
                    hotelStatus: calc.hotel.status,
                    totalCommission: new Decimal(0),
                    bookingCount: 0,
                    calculations: []
                });
            }

            const summary = hotelSummaries.get(hotelId)!;
            summary.totalCommission = summary.totalCommission.add(calc.totalAmount);
            summary.bookingCount += 1;
            summary.calculations.push({
                bookingId: calc.booking.id,
                bookingAmount: calc.booking.amount.toString(),
                commission: calc.totalAmount.toString(),
                calculatedAt: calc.calculatedAt
            });
        }

        const grandTotal = Array.from(hotelSummaries.values()).reduce((sum, hotel) => sum.add(hotel.totalCommission), new Decimal(0));

        return{
            month,
            period: {
                start: startDate,
                end: endDate
            },
            summary: Array.from(hotelSummaries.values()).map(hotel => ({
                hotelId: hotel.hotelId,
                hotelName: hotel.hotelName,
                hotelStatus: hotel.hotelStatus,
                totalCommission: hotel.totalCommission.toString(),
                bookingCount: hotel.bookingCount,
                calculations: hotel.calculations
            })),
            totals: {
                totalHotels: hotelSummaries.size,
                totalBookings: calculations.length,
                grandTotalCommission: grandTotal.toString()
            }
        }
    }

    async exportMonthlySummary(month: string): Promise<string> {
        const summary = await this.getMonthlySummary(month);

        const headers = [
            'Hotel Name',
            'Hotel Status',
            'Total Bookings',
            'Total Commission (CHF)',
            'Avg Commission (CHF)'
        ];

        const rows = summary.summary.map((hotel: any) => {
            const avgCommission = hotel.bookingCount > 0
                ? (parseFloat(hotel.totalCommission) / hotel.bookingCount).toFixed(2)
                : '0.00';

            return [
                `"${hotel.hotelName}"`,
                hotel.hotelStatus,
                hotel.bookingCount.toString(),
                parseFloat(hotel.totalCommission).toFixed(2),
                avgCommission
            ];
        });

        rows.push([
            'TOTAL',
            '',
            summary.totals.totalBookings.toString(),
            parseFloat(summary.totals.grandTotalCommission).toFixed(2),
            ''
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        return csv;
    }
}
