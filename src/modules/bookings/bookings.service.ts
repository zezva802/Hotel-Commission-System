import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '@prisma/client';
import { BookingsRepository } from './bookings.repository';

@Injectable()
export class BookingsService {
    constructor(private repository: BookingsRepository) {}

    async create(createBookingDto: CreateBookingDto) {
        const hotel = await this.repository.findHotelById(createBookingDto.hotelId);

        if (!hotel) {
            throw new NotFoundException(`Hotel with ID ${createBookingDto.hotelId} not found`);
        }

        return this.repository.create({
            hotelId: createBookingDto.hotelId,
            amount: createBookingDto.amount,
            bookingDate: createBookingDto.bookingDate
                ? new Date(createBookingDto.bookingDate)
                : new Date(),
            status: BookingStatus.PENDING,
        });
    }

    async findAll() {
        return this.repository.findAll();
    }

    async findOne(id: string) {
        const booking = await this.repository.findById(id);

        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }

        return booking;
    }

    async markAsCompleted(id: string) {
        const booking = await this.findOne(id);

        if (booking.status === BookingStatus.COMPLETED) {
            throw new BadRequestException('Booking is already completed');
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new BadRequestException('Cannot complete a cancelled booking');
        }

        return this.repository.update(id, {
            status: BookingStatus.COMPLETED,
            completedAt: new Date(),
        });
    }
}