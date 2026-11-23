const asyncHandler = require('express-async-handler');
const { StatusCodes } = require('http-status-codes');
const { createOnlineBookingService } = require('../services/booking.service');

/**
 * @desc  Create New online Booking
 * @route /api/v1/bookings/online
 * @method POST
 * @access private(only users)
 */
const createOnlineBooking = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const bookingData = req.body;
    const newBooking = await createOnlineBookingService(userId, bookingData);
    res.success(newBooking, StatusCodes.CREATED);
});

module.exports = {
    createOnlineBooking,
};
