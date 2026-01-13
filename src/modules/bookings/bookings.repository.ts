import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class BookingsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.booking.create({
      data,
      include: { hotel: true },
    });
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        commissionCalculation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        hotel: true,
        commissionCalculation: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.booking.update({
      where: { id },
      data,
      include: { hotel: true },
    });
  }

  async findHotelById(hotelId: string) {
    return this.prisma.hotel.findUnique({
      where: { id: hotelId },
    });
  }
}