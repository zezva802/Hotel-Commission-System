import { IsArray, IsDateString, IsEnum, IsNumber, IsOptional, Max, Min, ValidateNested} from "class-validator";
import { Type } from "class-transformer";
import { CommissionType } from "@prisma/client";


export class CreateTierRuleDto {
    @IsNumber()
    @Min(1)
    minBookings: number;

    @IsNumber()
    @Min(0)
    @Max(1)
    bonusRate: number;
}

export class CreateCommissionAgreementDto {
    @IsEnum(CommissionType)
    type: CommissionType;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
    baseRate?:number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    flatAmount?:number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    @Max(1)
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