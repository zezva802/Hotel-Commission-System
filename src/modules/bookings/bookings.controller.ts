import { Body, Controller, Post, Get, Param, Patch } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CommissionsService } from '../commissions/commissions.service';

@Controller('bookings')
export class BookingsController {
    constructor(
        private readonly bookingsService: BookingsService,
        private readonly commissionService: CommissionsService
    ) {}

    @Post()
    create(@Body() createBookingDto: CreateBookingDto) {
        return this.bookingsService.create(createBookingDto);
    }

    @Get()
    findAll() {
        return this.bookingsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.bookingsService.findOne(id);
    }

    @Patch(':id/complete')
    async markAsCompleted(@Param('id') id: string) {
        const booking = await this.bookingsService.markAsCompleted(id);
        let commission = null;
        let commissionError = null;
        try{
            commission = await this.commissionService.calculateCommission(id);
        } catch(error) {
            commissionError = error.message;
            console.error('Failed to calculate commission:', error.message);
        }
        return {
            booking,
            commission,
            ...(commissionError && {
                warning: 'Booking completed but commission calculation failed',
                error: commissionError
            })
        };
    }

    @Post(':id/calculate-commission')
    calculateCommission(@Param('id') bookingId: string) {
        return this.commissionService.calculateCommission(bookingId);
    }
}
