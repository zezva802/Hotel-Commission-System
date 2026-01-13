import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class CommissionsRepository {
  constructor(private prisma: PrismaService) {}

  async findBookingById(bookingId: string) {
    return this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        hotel: true,
        commissionCalculation: true
     }
    });
  }

  async findActiveAgreement(hotelId: string, bookingDate: Date) {
    return this.prisma.commissionAgreement.findFirst({
      where: {
        hotelId,
        isActive: true,
        validFrom: { lte: bookingDate },
        OR: [{ validTo: null }, { validTo: { gte: bookingDate } }],
      },
      include: {
        tierRules: {
          orderBy: { minBookings: 'desc' },
        },
      },
    });
  }

  async countCompletedBookings(
    hotelId: string,
    completedAt: Date,
  ) {
    const startOfMonth = new Date(completedAt.getFullYear(),completedAt.getMonth(), 1);
    return this.prisma.booking.count({
      where: {
        hotelId,
        status: BookingStatus.COMPLETED,
        completedAt: {
          gte: startOfMonth,
          lt: completedAt,
        },
      },
    });
  }

  async saveCalculation(data: any) {
    return this.prisma.commissionCalculation.create({
      data,
      include: {
        booking: { include: { hotel: true } },
        commissionAgreement: true,
      },
    });
  }

  async findCalculationsByMonth(startDate: Date, endDate: Date) {
    return this.prisma.commissionCalculation.findMany({
      where: {
        calculatedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { hotel: true,
        booking: true
       },
    });
  }
}