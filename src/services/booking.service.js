const { StatusCodes } = require('http-status-codes');
const { validateOnlineBooking, Booking } = require('../models/booking.model');
const AppError = require('../utils/AppError');
const validationError = require('../utils/validationError');
const { Room } = require('../models/room.model');
const ERROR_CODES = require('../constants/errorCodes');
const todayInHotel = require('../utils/date.utils');
const { STATUS, SOURCE } = require('../constants/status');
const { ensureGuestForBookingService } = require('./guest.service');
const mongoose = require('mongoose');

const createOnlineBookingService = async (userId, bookingData) => {
    const { error, value } = validateOnlineBooking(bookingData);
    if (error) {
        throw validationError(error);
    }
    const checkInDateString = value.checkInDate.toISOString().slice(0, 10);
    if (checkInDateString < todayInHotel) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.BAD_REQUEST,
            'Check in date can not be in the past',
        );
    }
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const totalNights = (value.checkOutDate - value.checkInDate) / MS_PER_DAY;

    const session = await mongoose.startSession();
    let newBooking;
    try {
        await session.withTransaction(async () => {
            const room = await Room.findById(value.room)
                .select('+bookingVersion')
                .session(session);
            if (!room) {
                throw new AppError(
                    StatusCodes.NOT_FOUND,
                    ERROR_CODES.NOT_FOUND,
                    'Room Not Found',
                );
            }
            if (!room.isAvailable) {
                throw new AppError(
                    StatusCodes.CONFLICT,
                    ERROR_CODES.CONFLICT,
                    'Room is not available',
                );
            }
            if (room.capacity < value.guestsCount) {
                throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    ERROR_CODES.BAD_REQUEST,
                    'Guests count exceeds room capacity',
                );
            }
            const pricePerNight = room.price; // Pricing SnapShot
            const totalPrice = totalNights * pricePerNight;
            const updatedRoom = await Room.findOneAndUpdate(
                {
                    _id: room._id,
                    bookingVersion: room.bookingVersion,
                    isAvailable: true,
                },
                {
                    $inc: { bookingVersion: 1 },
                },
                {
                    returnDocument: 'after',
                    session,
                },
            );
            if (!updatedRoom) {
                throw new AppError(
                    StatusCodes.CONFLICT,
                    ERROR_CODES.CONFLICT,
                    'Room availability has changed. Please try again.',
                );
            }

            const conflictingBooking = await Booking.findOne({
                room: value.room,
                status: { $ne: STATUS.CANCELLED }, // Confirmed - checkIn - checkOut
                checkInDate: { $lt: value.checkOutDate }, // Check-in before check-out
                checkOutDate: { $gt: value.checkInDate }, // Check-out after check-in
            }).session(session);
            if (conflictingBooking) {
                throw new AppError(
                    StatusCodes.CONFLICT,
                    ERROR_CODES.CONFLICT,
                    'This room is already booked for the selected dates.',
                );
            }
            const guest = await ensureGuestForBookingService(userId, session);
            [newBooking] = await Booking.create(
                [
                    {
                        guest,
                        room: room._id,
                        checkInDate: value.checkInDate,
                        checkOutDate: value.checkOutDate,
                        guestsCount: value.guestsCount,
                        pricePerNight,
                        totalPrice,
                        source: SOURCE.ONLINE,
                        notes: value.notes,
                    },
                ],
                { session },
            );
        });
    } finally {
        await session.endSession();
    }
    return newBooking;
};

module.exports = {
    createOnlineBookingService,
};
