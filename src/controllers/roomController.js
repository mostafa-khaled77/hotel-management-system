const asyncHandler = require('express-async-handler');
const {
    Room,
    validateCreateRoom,
    validateUpdateRoom,
} = require('../models/room.model');
const AppError = require('../utils/AppError');

/**
 * @desc  Get All Rooms
 * @route /api/v1/rooms
 * @method GET
 * @access public
 */
const getAllRooms = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;

    const roomList = await Room.find()
        .sort('roomNumber')
        .skip((page - 1) * limit)
        .limit(limit);
    const total = await Room.countDocuments();

    res.success(roomList, 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * @desc  Get Room By Id
 * @route /api/v1/rooms/:id
 * @method GET
 * @access public
 */
const getRoomById = asyncHandler(async (req, res, next) => {
    const room = await Room.findById(req.params.id);
    if (!room) {
        return next(new AppError(404, 'ROOM_NOT_FOUND', 'Room Not Found'));
    } else {
        res.success(room);
    }
});

/**
 * @desc  Create New Room
 * @route /api/v1/rooms
 * @method POST
 * @access public
 */
const createNewRoom = asyncHandler(async (req, res, next) => {
    const { error } = validateCreateRoom(req.body);
    if (error) {
        const errMessage = error.details.map((d) => d.message).join(',');
        return next(new AppError(400, 'VALIDATION_ERROR', errMessage));
    }

    const room = new Room({
        roomType: req.body.roomType,
        roomNumber: req.body.roomNumber,
        price: req.body.price,
        capacity: req.body.capacity,
        floor: req.body.floor,
        description: req.body.description,
        isAvailable: req.body.isAvailable,
    });
    const result = await room.save();

    res.success(result, 201);
});

/**
 * @desc  Update Room
 * @route /api/v1/rooms/:id
 * @method PATCH
 * @access public
 */
const updateRoom = asyncHandler(async (req, res, next) => {
    const { error } = validateUpdateRoom(req.body);
    if (error) {
        const errMessage = error.details.map((d) => d.message).join(',');
        return next(new AppError(400, 'VALIDATION_ERROR', errMessage));
    }
    const updatedRoom = await Room.findByIdAndUpdate(
        req.params.id,
        { $set: req.bodyw },
        { returnDocument: 'after', runValidators: true }
    );

    if (!updatedRoom) {
        return next(new AppError(404, 'NOT_FOUND', 'Room Not Found'));
    }

    res.success(updatedRoom);
});

/**
 * @desc  Delete Room
 * @route /api/v1/rooms/:id
 * @method DELETE
 * @access public
 */
const deleteRoom = asyncHandler(async (req, res, next) => {
    const deletedRoom = await Room.findByIdAndDelete(req.params.id);
    if (!deletedRoom) {
        return next(new AppError(404, 'NOT_FOUND', 'Room Not Found'));
    }

    res.status(204).send();
});

module.exports = {
    getAllRooms,
    getRoomById,
    createNewRoom,
    updateRoom,
    deleteRoom,
};
