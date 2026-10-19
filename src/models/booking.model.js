const { default: mongoose } = require('mongoose');
const { toJSONPlugin } = require('../config/toJSON.plugin');
const { object } = require('joi');
const { BOOKING_STATUS } = require('../constants/bookingStatus');

const BookingSchema = mongoose.Schema(
    {
        guestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Guest',
            required: true,
            index: true,
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
            index: true,
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },
        guestsCount: {
            type: Number,
            required: true,
            min: [1, 'Guest must at least 1'],
        },
        status: {
            type: String,
            enum: {
                values: object.values(BOOKING_STATUS),
                message: '{VALUE} is not a valid status',
            },
            default: BOOKING_STATUS.CONFIRMED,
            index: true,
        },
        pricePerNight: {
            type: Number,
            required: true,
            min: [0, 'Price per night cannot be less than 0 EGP'],
        },
        totalPrice: {
            type: Number,
            required: true,
            min: [0, 'Total price cannot be less than 0 EGP'],
        },
    },
    { timestamps: true },
);

BookingSchema.index({ roomId: 1, status: 1, checkIn: 1, checkOut: 1 });
BookingSchema.plugin(toJSONPlugin);

const Booking = mongoose.model('Booking', BookingSchema);
module.exports = {
    Booking,
};
