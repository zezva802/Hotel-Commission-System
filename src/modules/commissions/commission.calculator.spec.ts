import { Decimal } from '@prisma/client/runtime/library';
import { CommissionType, HotelStatus } from '@prisma/client';
import { CommissionCalculator } from './commission.calculator';

describe('CommissionCalculator', () => {
  let calculator: CommissionCalculator;

  beforeEach(() => {
    calculator = new CommissionCalculator();
  });

  describe('Percentage-based commissions', () => {
    it('should calculate basic percentage commission', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.STANDARD,
        tierRules: [],
        monthlyBookingCount: 0,
      });

      expect(result.baseAmount.toNumber()).toBe(100);
      expect(result.preferredBonus.toNumber()).toBe(0);
      expect(result.tierBonus.toNumber()).toBe(0);
      expect(result.totalAmount.toNumber()).toBe(100);
    });

    it('should add preferred bonus for PREFERRED hotels', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.PREFERRED,
        preferredBonus: new Decimal(0.02),
        tierRules: [],
        monthlyBookingCount: 0,
      });

      expect(result.baseAmount.toNumber()).toBe(100);
      expect(result.preferredBonus.toNumber()).toBe(20);
      expect(result.totalAmount.toNumber()).toBe(120);
    });

    it('should not add preferred bonus for STANDARD hotels', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.STANDARD,
        preferredBonus: new Decimal(0.02),
        tierRules: [],
        monthlyBookingCount: 0,
      });

      expect(result.preferredBonus.toNumber()).toBe(0);
      expect(result.totalAmount.toNumber()).toBe(100);
    });
  });

  describe('Flat fee commissions', () => {
    it('should use flat amount regardless of booking amount', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(5000),
        agreementType: CommissionType.FLAT_FEE,
        flatAmount: new Decimal(150),
        hotelStatus: HotelStatus.STANDARD,
        tierRules: [],
        monthlyBookingCount: 0,
      });

      expect(result.baseAmount.toNumber()).toBe(150);
      expect(result.baseRate).toBeNull();
      expect(result.totalAmount.toNumber()).toBe(150);
    });

    it('should use same flat amount for different booking amounts', () => {
      const result1 = calculator.calculate({
        bookingAmount: new Decimal(500),
        agreementType: CommissionType.FLAT_FEE,
        flatAmount: new Decimal(150),
        hotelStatus: HotelStatus.STANDARD,
        tierRules: [],
        monthlyBookingCount: 0,
      });

      const result2 = calculator.calculate({
        bookingAmount: new Decimal(10000),
        agreementType: CommissionType.FLAT_FEE,
        flatAmount: new Decimal(150),
        hotelStatus: HotelStatus.STANDARD,
        tierRules: [],
        monthlyBookingCount: 0,
      });

      expect(result1.totalAmount.toNumber()).toBe(150);
      expect(result2.totalAmount.toNumber()).toBe(150);
    });
  });

  describe('Tier bonuses', () => {
    it('should NOT apply tier bonus when below threshold', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.PREFERRED,
        preferredBonus: new Decimal(0.02),
        tierRules: [
          {
            minBookings: 5,
            bonusRate: new Decimal(0.01),
          },
        ],
        monthlyBookingCount: 4,
      });

      expect(result.tierBonus.toNumber()).toBe(0);
      expect(result.appliedTierRule).toBeNull();
      expect(result.totalAmount.toNumber()).toBe(120);
    });

    it('should apply tier bonus when threshold is met', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.PREFERRED,
        preferredBonus: new Decimal(0.02),
        tierRules: [
          {
            minBookings: 5,
            bonusRate: new Decimal(0.01),
          },
        ],
        monthlyBookingCount: 5,
      });

      expect(result.tierBonus.toNumber()).toBe(10);
      expect(result.appliedTierRule).toEqual({
        minBookings: 5,
        bonusRate: '0.01',
      });
      expect(result.totalAmount.toNumber()).toBe(130);
    });

    it('should apply tier bonus when above threshold', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.PREFERRED,
        preferredBonus: new Decimal(0.02),
        tierRules: [
          {
            minBookings: 5,
            bonusRate: new Decimal(0.01),
          },
        ],
        monthlyBookingCount: 10,
      });

      expect(result.tierBonus.toNumber()).toBe(10);
      expect(result.totalAmount.toNumber()).toBe(130);
    });

    it('should apply highest applicable tier from multiple tiers', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.08),
        hotelStatus: HotelStatus.STANDARD,
        tierRules: [
          {
            minBookings: 10,
            bonusRate: new Decimal(0.005),
          },
          {
            minBookings: 5,
            bonusRate: new Decimal(0.003),
          },
        ],
        monthlyBookingCount: 12,
      });

      expect(result.tierBonus.toNumber()).toBe(5);
      expect(result.appliedTierRule?.minBookings).toBe(10);
    });
  });

  describe('Complete scenarios', () => {
    it('should calculate Grand Hotel Zurich scenario (booking #5)', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.PREFERRED,
        preferredBonus: new Decimal(0.02),
        tierRules: [
          {
            minBookings: 5,
            bonusRate: new Decimal(0.01),
          },
        ],
        monthlyBookingCount: 4,
      });

      expect(result.totalAmount.toNumber()).toBe(120);
    });

    it('should calculate Grand Hotel Zurich scenario (booking #6)', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.10),
        hotelStatus: HotelStatus.PREFERRED,
        preferredBonus: new Decimal(0.02),
        tierRules: [
          {
            minBookings: 5,
            bonusRate: new Decimal(0.01),
          },
        ],
        monthlyBookingCount: 5,
      });

      expect(result.totalAmount.toNumber()).toBe(130);
    });

    it('should calculate Hotel Schweizerhof scenario', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(1000),
        agreementType: CommissionType.PERCENTAGE,
        baseRate: new Decimal(0.08),
        hotelStatus: HotelStatus.STANDARD,
        tierRules: [
          {
            minBookings: 10,
            bonusRate: new Decimal(0.005),
          },
        ],
        monthlyBookingCount: 10,
      });

      expect(result.baseAmount.toNumber()).toBe(80);
      expect(result.preferredBonus.toNumber()).toBe(0);
      expect(result.tierBonus.toNumber()).toBe(5);
      expect(result.totalAmount.toNumber()).toBe(85);
    });

    it('should calculate Park Hyatt scenario', () => {
      const result = calculator.calculate({
        bookingAmount: new Decimal(2500),
        agreementType: CommissionType.FLAT_FEE,
        flatAmount: new Decimal(150),
        hotelStatus: HotelStatus.STANDARD,
        tierRules: [],
        monthlyBookingCount: 0,
      });

      expect(result.totalAmount.toNumber()).toBe(150);
    });
  });

  describe('Error handling', () => {
    it('should throw error for PERCENTAGE without baseRate', () => {
      expect(() => {
        calculator.calculate({
          bookingAmount: new Decimal(1000),
          agreementType: CommissionType.PERCENTAGE,
          hotelStatus: HotelStatus.STANDARD,
          tierRules: [],
          monthlyBookingCount: 0,
        });
      }).toThrow('PERCENTAGE agreement must have baseRate');
    });

    it('should throw error for FLAT_FEE without flatAmount', () => {
      expect(() => {
        calculator.calculate({
          bookingAmount: new Decimal(1000),
          agreementType: CommissionType.FLAT_FEE,
          hotelStatus: HotelStatus.STANDARD,
          tierRules: [],
          monthlyBookingCount: 0,
        });
      }).toThrow('FLAT_FEE agreement must have flatAmount');
    });
  });
});