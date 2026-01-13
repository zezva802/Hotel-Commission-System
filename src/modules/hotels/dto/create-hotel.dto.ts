import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import {HotelStatus} from '@prisma/client';


export class CreateHotelDto{
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(HotelStatus)
    status: HotelStatus;
}