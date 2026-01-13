import { IsDateString, IsOptional, IsString, IsNumber } from "class-validator";

export class CreateBookingDto {
    @IsString()
    hotelId: string;

    @IsNumber()
    amount: number;

    @IsOptional()
    @IsDateString()
    bookingDate?: string;
}