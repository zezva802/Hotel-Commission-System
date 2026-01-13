import { Decimal } from '@prisma/client/runtime/library';
import { CommissionType, HotelStatus } from '@prisma/client';

export interface CalculationInput {
  bookingAmount: Decimal;
  agreementType: CommissionType;
  baseRate?: Decimal;
  flatAmount?: Decimal;
  hotelStatus: HotelStatus;
  preferredBonus?: Decimal;
  tierRules: Array<{
    minBookings: number;
    bonusRate: Decimal;
  }>;
  monthlyBookingCount: number;
}

export interface CalculationResult {
  baseAmount: Decimal;
  baseRate: Decimal | null;
  preferredBonus: Decimal;
  tierBonus: Decimal;
  totalAmount: Decimal;
  appliedTierRule: {
    minBookings: number;
    bonusRate: string;
  } | null;
}


export class CommissionCalculator {

  calculate(input: CalculationInput): CalculationResult {
    const { baseAmount, baseRate } = this.calculateBase(input);

    const preferredBonus = this.calculatePreferredBonus(input);

    const { tierBonus, appliedTierRule } = this.calculateTierBonus(input);

    const totalAmount = baseAmount
      .add(preferredBonus)
      .add(tierBonus);

    return {
      baseAmount,
      baseRate,
      preferredBonus,
      tierBonus,
      totalAmount,
      appliedTierRule
    };
  }

  private calculateBase(input: CalculationInput): {
    baseAmount: Decimal;
    baseRate: Decimal | null;
  } {
    if (input.agreementType === CommissionType.PERCENTAGE) {
      if (!input.baseRate) {
        throw new Error('PERCENTAGE agreement must have baseRate');
      }
      return {
        baseAmount: input.bookingAmount.mul(input.baseRate),
        baseRate: input.baseRate,
      };
    }

    if (input.agreementType === CommissionType.FLAT_FEE) {
      if (!input.flatAmount) {
        throw new Error('FLAT_FEE agreement must have flatAmount');
      }
      return {
        baseAmount: input.flatAmount,
        baseRate: null
      };
    }

    throw new Error(`Unknown commission type: ${input.agreementType}`);
  }

  private calculatePreferredBonus(input: CalculationInput): Decimal {
    if (
      input.hotelStatus === HotelStatus.PREFERRED &&
      input.preferredBonus
    ) {
      return input.bookingAmount.mul(input.preferredBonus);
    }

    return new Decimal(0);
  }

  private calculateTierBonus(input: CalculationInput): {
    tierBonus: Decimal;
    appliedTierRule: { minBookings: number; bonusRate: string } | null;
  } {
    if (!input.tierRules || input.tierRules.length === 0) {
      return {
        tierBonus: new Decimal(0),
        appliedTierRule: null
      };
    }

    const applicableTier = input.tierRules.find(
      (rule) => input.monthlyBookingCount >= rule.minBookings
    );

    if (!applicableTier) {
      return {
        tierBonus: new Decimal(0),
        appliedTierRule: null
      };
    }

    return {
      tierBonus: input.bookingAmount.mul(applicableTier.bonusRate),
      appliedTierRule: {
        minBookings: applicableTier.minBookings,
        bonusRate: applicableTier.bonusRate.toString()
      }
    };
  }
}