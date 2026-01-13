import { Controller, Param, Post } from '@nestjs/common';
import { CommissionsService } from './commissions.service';

@Controller('commissions')
export class CommissionsController {
    constructor(private readonly commissionsService: CommissionsService) {}

    @Post('calculate/:bookingId')
    calculateCommission(@Param('bookingId') bookingId: string) {
        return this.commissionsService.calculateCommission(bookingId);
    }
}
