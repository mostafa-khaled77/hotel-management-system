const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifyToken');
const { createOnlineBooking } = require('../controllers/BookingController');

router.post('/online', verifyToken, createOnlineBooking);
// router.post('/reception',)
// router.get('/',)
// router.get('/my-bookings',)
// router.get('/:id',)
// router.patch('/:id/status',)
// router.patch('/:id/cancel',)

module.exports = router;
