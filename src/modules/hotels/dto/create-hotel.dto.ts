import { IsEnum, IsString } from "class-validator";

export enum HotelStatus {
    STANDART = 'STANDARD',
    PREFERRED = 'PREFERRED',
}

export class CreateHotelDto{
    @IsString()
    name: string;

    @IsEnum(HotelStatus)
    status: HotelStatus;
}