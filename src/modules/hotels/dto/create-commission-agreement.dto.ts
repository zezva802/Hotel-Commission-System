import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, ValidateNested} from "class-validator";
import { Type } from "class-transformer";

export enum CommissionType {
    PERCNTAGE = 'PERCENTAGE',
    FLAT_FEE = 'FLAT_FEE',
}

export class CreateTierRuleDto {
    @IsNumber()
    minBookings: number;

    @IsNumber()
    bonusRate: number;
}

export class CreateCommissionAgreementDto {
    @IsEnum(CommissionType)
    type: CommissionType;

    @IsOptional()
    @IsNumber()
    baseRate?:number;

    @IsOptional()
    @IsNumber()
    flatAmount?:number;

    @IsOptional()
    @IsNumber()
    preferredBonus?:number;

    @IsDateString()
    validFrom: string;

    @IsOptional()
    @IsDateString()
    validTo?: number

    @IsOptional()
    @IsArray()
    @ValidateNested({each: true})
    @Type(() => CreateTierRuleDto)
    tierRules?: CreateTierRuleDto[];
}