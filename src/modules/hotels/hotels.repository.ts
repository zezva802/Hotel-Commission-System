import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HotelsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.hotel.create({ data });
  }

  async findAll() {
    return this.prisma.hotel.findMany({
      include: {
        commissionAgreements: {
          where: { isActive: true },
          include: { tierRules: true },
        },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.hotel.findUnique({
      where: { id },
      include: {
        commissionAgreements: {
          where: { isActive: true },
          include: { tierRules: true },
        },
      },
    });
  }

  async deactivateAgreements(hotelId: string, validTo: Date) {
    return this.prisma.commissionAgreement.updateMany({
      where: { hotelId, isActive: true },
      data: { isActive: false, validTo },
    });
  }

  async createAgreement(data: any) {
    return this.prisma.commissionAgreement.create({
      data,
      include: { tierRules: true },
    });
  }

  async findActiveAgreement(hotelId: string) {
    return this.prisma.commissionAgreement.findFirst({
      where: { hotelId, isActive: true },
      include: {
        tierRules: {
          orderBy: { minBookings: 'asc' },
        },
      },
    });
  }
}