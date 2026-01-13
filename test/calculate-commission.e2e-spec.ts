import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { CommissionsService } from '../src/modules/commissions/commissions.service';
import { CommissionType, HotelStatus } from '@prisma/client';

describe('Calculate Commission (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let commissionsService: CommissionsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    commissionsService = moduleFixture.get<CommissionsService>(CommissionsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.commissionCalculation.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.tierRule.deleteMany();
    await prisma.commissionAgreement.deleteMany();
    await prisma.hotel.deleteMany();
  });

  it('should calculate commission for a completed booking', async () => {
    const hotel = await prisma.hotel.create({
      data: {
        name: 'Test Hotel',
        status: HotelStatus.STANDARD,
        commissionAgreements: {
          create: {
            type: CommissionType.PERCENTAGE,
            baseRate: 0.10,
            validFrom: new Date('2024-01-01'),
            isActive: true,
          },
        },
      },
    });

    const booking = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        amount: 1000,
        status: 'COMPLETED',
        completedAt: new Date(),
        bookingDate: new Date(),
      },
    });

    const result = await commissionsService.calculateCommission(booking.id);

    expect(result).toBeDefined();
    expect(result.bookingId).toBe(booking.id);
    expect(result.hotelId).toBe(hotel.id);
    expect(parseFloat(result.baseAmount.toString())).toBe(100);
    expect(parseFloat(result.totalAmount.toString())).toBe(100);
  });

  it('should include tier bonus when threshold is met', async () => {
    const hotel = await prisma.hotel.create({
      data: {
        name: 'Hotel with Tiers',
        status: HotelStatus.STANDARD,
        commissionAgreements: {
          create: {
            type: CommissionType.PERCENTAGE,
            baseRate: 0.08,
            validFrom: new Date('2024-01-01'),
            isActive: true,
            tierRules: {
              create: { minBookings: 2, bonusRate: 0.005 },
            },
          },
        },
      },
    });

    const bookingDate = new Date('2024-03-15');
    await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        amount: 1000,
        status: 'COMPLETED',
        completedAt: new Date('2024-03-10'),
        bookingDate,
      },
    });

    await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        amount: 1000,
        status: 'COMPLETED',
        completedAt: new Date('2024-03-12'),
        bookingDate,
      },
    });

    const booking3 = await prisma.booking.create({
      data: {
        hotelId: hotel.id,
        amount: 1000,
        status: 'COMPLETED',
        completedAt: new Date('2024-03-15'),
        bookingDate,
      },
    });

    const result = await commissionsService.calculateCommission(booking3.id);

    expect(parseFloat(result.baseAmount.toString())).toBe(80);
    expect(parseFloat(result.tierBonus!.toString())).toBe(5);
    expect(parseFloat(result.totalAmount.toString())).toBe(85);
  });

  it('should use correct rate when agreement changes mid-month', async () => {
    const hotel = await prisma.hotel.create({
        data: {
        name: 'Hotel with Rate Change',
        status: HotelStatus.STANDARD,
        commissionAgreements: {
            create: {
            type: CommissionType.PERCENTAGE,
            baseRate: 0.10,
            validFrom: new Date('2024-03-01'),
            validTo: new Date('2024-03-15'),
            isActive: false,
            },
        },
        },
    });

    await prisma.commissionAgreement.create({
        data: {
        hotelId: hotel.id,
        type: CommissionType.PERCENTAGE,
        baseRate: 0.12,
        validFrom: new Date('2024-03-16'),
        isActive: true,
        },
    });

    const booking1 = await prisma.booking.create({
        data: {
        hotelId: hotel.id,
        amount: 1000,
        status: 'COMPLETED',
        completedAt: new Date('2024-03-10'),
        bookingDate: new Date('2024-03-10'),
        },
    });

    const booking2 = await prisma.booking.create({
        data: {
        hotelId: hotel.id,
        amount: 1000,
        status: 'COMPLETED',
        completedAt: new Date('2024-03-20'),
        bookingDate: new Date('2024-03-20'),
        },
    });

    const result1 = await commissionsService.calculateCommission(booking1.id);
    const result2 = await commissionsService.calculateCommission(booking2.id);

    expect(parseFloat(result1.totalAmount.toString())).toBe(100);
    expect(parseFloat(result2.totalAmount.toString())).toBe(120);
    });
});