const express = require('express');
const validateObjectId = require('../middlewares/validateObjectId');
const router = express.Router();

// api/v1/rooms
// prettier-ignore
router
    .route('/')
// .get(getAllBookings)
// .post(createNewBooking);

// api/v1/rooms/:id
router.route('/:id').all(validateObjectId);
// .get(getBookingById)
// .patch(updateBooking)

module.exports = router;
