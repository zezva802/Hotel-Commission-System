import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { CreateCommissionAgreementDto } from './dto/create-commission-agreement.dto';
import { UpdateCommissionAgreementDto } from './dto/update-commission-agreement.dto';


@Controller('hotels')
export class HotelsController {
    constructor(private readonly hotelsService: HotelsService) {}

    @Post()
    create(@Body() createHotelDto: CreateHotelDto) {
        return this.hotelsService.create(createHotelDto);
    }

    @Get()
    findAll() {
        return this.hotelsService.findAll();
    }

    @Post(':id/commission-agreement')
    createCommissionAgreement(
        @Param('id') hotelId: string,
        @Body() createCommissionAgreementDto: CreateCommissionAgreementDto
    ){
        return this.hotelsService.createCommissionAgreement(hotelId, createCommissionAgreementDto);
    }

    @Get(':id/commission-agreement')
    getActiveCommissionAgreement(@Param('id') hotelId: string) {
        return this.hotelsService.getActiveCommissionAgreement(hotelId);
    }

    @Patch(':id/commission-agreement')
    updateCommissionAgreement(
        @Param('id') hotelId: string,
        @Body() updateDto: UpdateCommissionAgreementDto
    ) {
        return this.hotelsService.updateCommissionAgreement(hotelId, updateDto);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.hotelsService.findOne(id);
    }
}
