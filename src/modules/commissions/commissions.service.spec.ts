import { Test, TestingModule } from '@nestjs/testing';
import { CommissionsService } from './commissions.service';
import { CommissionsRepository } from './commissions.repository';
import { CommissionCalculator } from './commission.calculator';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingStatus, CommissionType, HotelStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

describe('CommissionsService', () => {
  let service: CommissionsService;
  let repository: CommissionsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommissionsService,
        {
          provide: CommissionsRepository,
          useValue: {
            findBookingById: jest.fn(),
            findActiveAgreement: jest.fn(),
            countCompletedBookings: jest.fn(),
            saveCalculation: jest.fn(),
            findCalculationsByMonth: jest.fn(),
          },
        },
        CommissionCalculator,
      ],
    }).compile();

    service = module.get<CommissionsService>(CommissionsService);
    repository = module.get<CommissionsRepository>(CommissionsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCommission', () => {
    it('should throw NotFoundException if booking does not exist', async () => {
      jest.spyOn(repository, 'findBookingById').mockResolvedValue(null);

      await expect(service.calculateCommission('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if booking is not completed', async () => {
      const mockBooking = {
        id: 'booking-1',
        status: BookingStatus.PENDING,
      };
      jest.spyOn(repository, 'findBookingById').mockResolvedValue(mockBooking as any);

      await expect(service.calculateCommission('booking-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should calculate commission for valid completed booking', async () => {
      const mockBooking = {
        id: 'booking-1',
        hotelId: 'hotel-1',
        amount: new Decimal(1000),
        status: BookingStatus.COMPLETED,
        completedAt: new Date(),
        bookingDate: new Date(),
        hotel: { id: 'hotel-1', status: HotelStatus.STANDARD },
        commissionCalculation: null,
      };

      const mockAgreement = {
        id: 'agreement-1',
        type: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        tierRules: [],
      };

      jest.spyOn(repository, 'findBookingById').mockResolvedValue(mockBooking as any);
      jest.spyOn(repository, 'findActiveAgreement').mockResolvedValue(mockAgreement as any);
      jest.spyOn(repository, 'countCompletedBookings').mockResolvedValue(0);
      jest.spyOn(repository, 'saveCalculation').mockResolvedValue({ id: 'calc-1' } as any);

      const result = await service.calculateCommission('booking-1');

      expect(result).toBeDefined();
      expect(repository.saveCalculation).toHaveBeenCalled();
    });
  });

  describe('getMonthlySummary', () => {
    it('should throw BadRequestException for invalid month format', async () => {
      await expect(service.getMonthlySummary('invalid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return summary for valid month', async () => {
      jest.spyOn(repository, 'findCalculationsByMonth').mockResolvedValue([]);

      const result = await service.getMonthlySummary('2024-03');

      expect(result.month).toBe('2024-03');
      expect(result.summary).toBeInstanceOf(Array);
    });
  });
});