import { BadRequestException, Body, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
    constructor(private prisma: PrismaService){}

    async create(createBookingDto: CreateBookingDto){
        const hotel = await this.prisma.hotel.findUnique({
            where:{id: createBookingDto.hotelId}
        });
        if(!hotel) {
            throw new NotFoundException(`Hotel with ID ${createBookingDto.hotelId} not found`);
        }

        const booking = await this.prisma.booking.create({
            data: {
                hotelId: createBookingDto.hotelId,
                amount: createBookingDto.amount,
                bookingDate: createBookingDto.bookingDate ? new Date(createBookingDto.bookingDate) : new Date(),
                status: 'PENDING'
            },
            include: {
                hotel: true,
            }
        });

        return booking;
    }

    async findAll(){
        return this.prisma.booking.findMany({
            include: {
                hotel: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                    }
                },
                commissionCalculation: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    async findOne(id: string){
        const booking = await this.prisma.booking.findUnique({
            where: {id},
            include: {
                hotel: true,
                commissionCalculation: true
            }
        });

        if(!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }

        return booking;
    }

    async markAsCompleted(id: string) {
        const booking = await this.findOne(id);

        if(booking.status === 'COMPLETED') {
            throw new BadRequestException('Booking is already completed');
        }

        if(booking.status === 'CANCELLED') {
            throw new BadRequestException('Cannot complete a cancelled booking');
        }

        const updatedBooking = await this.prisma.booking.update({
            where: {id},
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            },
            include: {
                hotel: true
            }
        });

        return updatedBooking;
    }
}
