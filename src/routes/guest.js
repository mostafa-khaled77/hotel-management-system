const express = require('express');
const validateObjectId = require('../middlewares/validateObjectId');
const {
    getAllGuests,
    createNewGuest,
    getGuestById,
    updateGuest,
    deleteGuest,
} = require('../controllers/guestController');
const { verifyTokenAndAdmin } = require('../middlewares/verifyToken');
const router = express.Router();

// api/v1/guests
// prettier-ignore
router
    .route('/')
    .get(verifyTokenAndAdmin, getAllGuests)
    .post(verifyTokenAndAdmin, createNewGuest);

// api/v1/guests/:id
router
    .route('/:id')
    .all(validateObjectId)
    .get(verifyTokenAndAdmin, getGuestById)
    .patch(verifyTokenAndAdmin, updateGuest)
    .delete(verifyTokenAndAdmin, deleteGuest);

module.exports = router;
