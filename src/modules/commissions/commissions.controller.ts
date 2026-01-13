import { Controller, Param, Post, Get, BadRequestException, Query, Header, Res } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { Response } from 'express';


@Controller('commissions')
export class CommissionsController {
    constructor(private readonly commissionsService: CommissionsService) {}
    @Get('summary')
    getMonthlySummary(@Query('month') month: string) {
        if(!month){
            throw new BadRequestException('Month parameter is required (format: YYYY-MM');
        }
        return this.commissionsService.getMonthlySummary(month);
    }

    @Get('export')
    @Header('Content-Type', 'text/csv')
    @Header('Content-Disposition', 'attachment; filename="commissions.csv"')
    async exportMonthlyCommissions(
        @Query('month') month: string,
        @Res() res: Response
    ) {
        if (!month) {
            throw new BadRequestException('Month query parameter is required (format: YYYY-MM)');
        }

        const csv = await this.commissionsService.exportMonthlySummary(month);

        res.setHeader('Content-Disposition', `attachment; filename="commissions-${month}.csv"`);
        
        res.send(csv);
    }

    @Post('calculate/:bookingId')
    calculateCommission(@Param('bookingId') bookingId: string) {
        return this.commissionsService.calculateCommission(bookingId);
    }
}
