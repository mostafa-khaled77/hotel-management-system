const express = require('express');
const {
    getAllRooms,
    createNewRoom,
    getRoomById,
    updateRoom,
    deleteRoom,
} = require('../controllers/roomController');
const validateObjectId = require('../middlewares/validateObjectId');
const router = express.Router();

// api/v1/rooms
router.route('/').get(getAllRooms).post(createNewRoom);

// api/v1/rooms/:id
router
    .route('/:id')
    .all(validateObjectId)
    .get(getRoomById)
    .patch(updateRoom)
    .delete(deleteRoom);

module.exports = router;
