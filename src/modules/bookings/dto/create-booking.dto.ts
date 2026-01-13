import { IsDateString, IsOptional, IsString, IsNumber, IsUUID, Min } from "class-validator";

export class CreateBookingDto {
    @IsUUID('4')
    hotelId: string;

    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0.01)
    amount: number;

    @IsOptional()
    @IsDateString()
    bookingDate?: string;
}