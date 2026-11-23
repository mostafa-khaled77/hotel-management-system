const { default: mongoose } = require('mongoose');
const { STATUS, SOURCE, PAYMENT_STATUS } = require('../constants/status');
const { toJSONPlugin } = require('../config/toJSON.plugin');
const Joi = require('joi');
const { validateCreateGuest } = require('./guest.model');

const BookingSchema = new mongoose.Schema(
    {
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Guest',
            required: true,
        },
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
        },
        checkInDate: {
            type: Date,
            required: true,
        },
        checkOutDate: {
            type: Date,
            required: true,
            validate: {
                validator(value) {
                    return value > this.checkInDate;
                },
                message: 'check-out Date must be after than check-in Date!.',
            },
        },
        guestsCount: {
            type: Number,
            required: true,
            min: 1,
            validate: Number.isInteger,
        },
        pricePerNight: {
            type: Number,
            required: true,
            min: 0,
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: Object.values(STATUS),
            default: STATUS.CONFIRMED,
        },
        paymentStatus: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.UNPAID,
        },
        source: {
            type: String,
            required: true,
            enum: Object.values(SOURCE),
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);
// Date parsing
const dateOnly = Joi.any()
    .custom((value, helpers) => {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return helpers.error('dateOnly.format');
        }
        const date = new Date(`${value}T00:00:00.000Z`);
        if (
            Number.isNaN(date.getTime()) ||
            date.toISOString().slice(0, 10) !== value
        ) {
            return helpers.error('dateOnly.invalid');
        }
        return date;
    })
    .messages({
        'dateOnly.format': '{{#label}} must use YYYY-MM-DD format.',
        'dateOnly.invalid': '{{#label}} must be a valid calendar date.',
    });

//  Check if checkOut Date after checkIn Date
const validateBookingDates = (value, helpers) => {
    const { checkInDate, checkOutDate } = value;
    if (!(checkInDate instanceof Date) || !(checkOutDate instanceof Date)) {
        return value;
    }
    if (checkOutDate <= checkInDate) {
        return helpers.error('dateRange.invalid');
    }
    return value;
};

// Validate Online Booking
function validateOnlineBooking(obj) {
    const schema = Joi.object({
        room: Joi.string().required(),
        checkInDate: dateOnly.required(),
        checkOutDate: dateOnly.required(),
        guestsCount: Joi.number().integer().min(1).required(),
        notes: Joi.string().trim().optional(),
    })
        .custom(validateBookingDates)
        .messages({
            'dateRange.invalid': 'Check-out date must be after check-in date.',
        });
    return schema.validate(obj, { abortEarly: false });
}

// Validate Reception Booking
function validateReceptionBooking(obj) {
    const schema = Joi.object({
        guest: Joi.alternatives()
            .try(
                Joi.string(),
                Joi.object().custom((value, helpers) => {
                    const { error } = validateCreateGuest(value);
                    if (error) {
                        return helpers.error('any.custom');
                    }
                    return value;
                }),
            )
            .required(),
        room: Joi.string().required(),
        checkInDate: dateOnly.required(),
        checkOutDate: dateOnly.required(),
        guestsCount: Joi.number().integer().min(1).required(),
        notes: Joi.string().trim().optional(),
    })
        .custom(validateBookingDates)
        .messages({
            'dateRange.invalid': 'Check-out date must be after check-in date.',
        });
    return schema.validate(obj, { abortEarly: false });
}

// Validate Update Status
function validateBookingStatusUpdate(obj) {
    const schema = Joi.object({
        status: Joi.string()
            .valid(...Object.values(STATUS))
            .required(),
    });
    return schema.validate(obj, { abortEarly: false });
}

BookingSchema.plugin(toJSONPlugin);
BookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 }); // Fast lookup for date-range overlap checks on a specific room
BookingSchema.index({ room: 1, status: 1, checkInDate: 1, checkOutDate: 1 }); // Optimize active booking overlap checks (filtering out cancelled bookings)
BookingSchema.index({ guest: 1, createdAt: -1 }); // Fast retrieval of a guest's booking history sorted by newest first
BookingSchema.index({ status: 1, checkInDate: 1 }); // Optimize admin operational lists and filtering by booking status and check-in date
const Booking = mongoose.model('Booking', BookingSchema);

module.exports = {
    Booking,
    validateOnlineBooking,
    validateReceptionBooking,
    validateBookingStatusUpdate,
};
