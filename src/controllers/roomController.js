const asyncHandler = require('express-async-handler');
const {
    validateCreateRoom,
    validateUpdateRoom,
} = require('../models/room.model');
const validationError = require('../utils/validationError');
const { StatusCodes } = require('http-status-codes');
const {
    createRoomService,
    findRoomByIdService,
    getAllRoomsService,
    updateRoomService,
    deleteRoomService,
} = require('../services/room.service');

/**
 * @desc  Get All Rooms
 * @route /api/v1/rooms
 * @method GET
 * @access public
 */
const getAllRooms = asyncHandler(async (req, res) => {
    const { roomList, pagination } = await getAllRoomsService(req.query);
    res.success(roomList, StatusCodes.OK, pagination);
});

/**
 * @desc  Get Room By Id
 * @route /api/v1/rooms/:id
 * @method GET
 * @access public
 */
const getRoomById = asyncHandler(async (req, res) => {
    const room = await findRoomByIdService(req.params.id);
    res.success(room);
});

/**
 * @desc  Create New Room
 * @route /api/v1/rooms
 * @method POST
 * @access private(only Admins)
 */
const createNewRoom = asyncHandler(async (req, res, next) => {
    const { error } = validateCreateRoom(req.body);
    if (error) {
        return next(validationError(error));
    }
    const result = await createRoomService(req.body);
    res.success(result, StatusCodes.CREATED);
});

/**
 * @desc  Update Room
 * @route /api/v1/rooms/:id
 * @method PATCH
 * @access private(only Admins)
 */
const updateRoom = asyncHandler(async (req, res, next) => {
    const { error } = validateUpdateRoom(req.body);
    if (error) {
        return next(validationError(error));
    }
    const updatedRoom = await updateRoomService(req.params.id, req.body);
    res.success(updatedRoom);
});

/**
 * @desc  Delete Room
 * @route /api/v1/rooms/:id
 * @method DELETE
 * @access private(only Admins)
 */
const deleteRoom = asyncHandler(async (req, res) => {
    const deletedRoom = await deleteRoomService(req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
});

module.exports = {
    getAllRooms,
    getRoomById,
    createNewRoom,
    updateRoom,
    deleteRoom,
};
