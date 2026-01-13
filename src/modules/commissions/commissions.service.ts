import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CommissionType } from '@prisma/client';
import { CommissionsRepository } from './commissions.repository';
import { CommissionCalculator } from './commission.calculator';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CommissionsService {
    constructor(
        private repository: CommissionsRepository,
        private calculator: CommissionCalculator,
    ) {}

    async calculateCommission(bookingId: string) {
        const booking = await this.repository.findBookingById(bookingId);

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${bookingId} not found`);
        }

        if (booking.status !== 'COMPLETED') {
            throw new BadRequestException('Booking must be completed before calculating commission');
        }

        if (booking.commissionCalculation) {
            throw new BadRequestException('Commission already calculated for this booking');
        }

        if (!booking.completedAt) {
            throw new BadRequestException('Booking has no completion date');
        }

        const agreement = await this.repository.findActiveAgreement(
            booking.hotelId,
            booking.bookingDate,
        );

        if (!agreement) {
            throw new NotFoundException(
                `No commission agreement found for hotel ${booking.hotelId} at ${booking.bookingDate}`
            );
        }

        const monthlyCount = await this.repository.countCompletedBookings(
            booking.hotelId,
            booking.completedAt,
        );

        const result = this.calculator.calculate({
            bookingAmount: booking.amount,
            agreementType: agreement.type,
            baseRate: agreement.baseRate || undefined,
            flatAmount: agreement.flatAmount || undefined,
            hotelStatus: booking.hotel.status,
            preferredBonus: agreement.preferredBonus || undefined,
            tierRules: agreement.tierRules.map((rule) => ({
                minBookings: rule.minBookings,
                bonusRate: rule.bonusRate,
            })),
            monthlyBookingCount: monthlyCount,
        });

        const calculation = await this.repository.saveCalculation({
            bookingId: booking.id,
            hotelId: booking.hotelId,
            commissionAgreementId: agreement.id,
            baseAmount: result.baseAmount,
            baseRate: result.baseRate,
            preferredBonus: result.preferredBonus,
            tierBonus: result.tierBonus,
            totalAmount: result.totalAmount,
            calculationDetails: {
                monthlyBookingCount: monthlyCount,
                appliedTierRule: result.appliedTierRule,
            },
        });

        return calculation;
    }

    async getMonthlySummary(month: string) {
        const [year, monthNum] = month.split('-').map(Number);

        if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
            throw new BadRequestException('Invalid month format. Use YYYY-MM');
        }

        const startDate = new Date(year, monthNum - 1, 1);
        const endDate = new Date(year, monthNum, 0, 23, 59, 59);

        const calculations = await this.repository.findCalculationsByMonth(
            startDate,
            endDate
        );

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
            if (!hotelSummaries.has(hotelId)) {
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

        const grandTotal = Array.from(hotelSummaries.values()).reduce(
            (sum, hotel) => sum.add(hotel.totalCommission),
            new Decimal(0)
        );

        return {
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
        };
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