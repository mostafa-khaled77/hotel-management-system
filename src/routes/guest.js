const express = require('express');
const validateObjectId = require('../middlewares/validateObjectId');
const {
    getAllGuests,
    createNewGuest,
    getGuestById,
    updateGuest,
    deleteGuest,
} = require('../controllers/guestController');
const router = express.Router();

// api/v1/guests
// prettier-ignore
router
    .route('/')
    .get(getAllGuests)
    .post(createNewGuest);

// api/v1/guests/:id
router
    .route('/:id')
    .all(validateObjectId)
    .get(getGuestById)
    .patch(updateGuest)
    .delete(deleteGuest);

module.exports = router;
