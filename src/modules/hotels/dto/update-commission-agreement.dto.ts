import { IsOptional, IsEnum, IsNumber, IsDateString, ValidateNested, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CommissionType } from '@prisma/client';

class TierRuleDto {
    @IsNumber()
    @Min(1)
    minBookings: number;

    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    bonusRate: number;
}

export class UpdateCommissionAgreementDto {
    @IsOptional()
    @IsEnum(CommissionType)
    type?: CommissionType;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    baseRate?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    flatAmount?: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 4 })
    @Min(0)
    preferredBonus?: number;

    @IsOptional()
    @IsDateString()
    validFrom?: string;

    @IsOptional()
    @IsDateString()
    validTo?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => TierRuleDto)
    tierRules?: TierRuleDto[];
}