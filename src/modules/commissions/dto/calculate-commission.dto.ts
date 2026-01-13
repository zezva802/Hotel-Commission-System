import { IsString } from "class-validator";

export class CalculateCommissionDto {
    @IsString()
    bookingId: String;
}