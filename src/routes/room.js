const express = require('express');
const {
    getAllRooms,
    createNewRoom,
    getRoomById,
    updateRoom,
    deleteRoom,
} = require('../controllers/roomController');
const { verifyTokenAndAdmin } = require('../middlewares/verifyToken');

const validateObjectId = require('../middlewares/validateObjectId');
const router = express.Router();

// api/v1/rooms
// prettier-ignore
router.route('/').get(getAllRooms)
                .post(verifyTokenAndAdmin ,createNewRoom);

// api/v1/rooms/:id
router
    .route('/:id')
    .all(validateObjectId)
    .get(getRoomById)
    .patch(verifyTokenAndAdmin , updateRoom)
    .delete(verifyTokenAndAdmin , deleteRoom);

module.exports = router;
