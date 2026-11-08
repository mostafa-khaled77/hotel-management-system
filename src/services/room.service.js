const { StatusCodes } = require('http-status-codes');
const { Room } = require('../models/room.model');
const AppError = require('../utils/AppError');
const getPagination = require('../utils/pagination');
const ERROR_CODES = require('../constants/errorCodes');

const getAllRoomsService = async (query) => {
    const { page, limit, skip } = getPagination(query);
    const [roomList, total] = await Promise.all([
        Room.find().sort('roomNumber').skip(skip).limit(limit),
        Room.countDocuments(),
    ]);
    return {
        roomList,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const findRoomByIdService = async (roomId) => {
    const room = await Room.findById(roomId);
    if (!room) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Room Not Found',
        );
    }
    return room;
};

const createRoomService = async (roomData) => {
    const room = new Room({
        roomType: roomData.roomType,
        roomNumber: roomData.roomNumber,
        price: roomData.price,
        capacity: roomData.capacity,
        floor: roomData.floor,
        description: roomData.description,
        isAvailable: roomData.isAvailable,
    });
    return await room.save();
};

const updateRoomService = async (roomId, UpdatedData) => {
    const updatedRoom = await Room.findByIdAndUpdate(
        roomId,
        { $set: UpdatedData },
        { returnDocument: 'after', runValidators: true },
    );
    if (!updatedRoom) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Room Not Found',
        );
    }
    return updatedRoom;
};

const deleteRoomService = async (roomId) => {
    const deletedRoom = await Room.findByIdAndDelete(roomId);
    if (!deletedRoom) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Room Not Found',
        );
    }
    return deletedRoom;
};

module.exports = {
    getAllRoomsService,
    findRoomByIdService,
    createRoomService,
    updateRoomService,
    deleteRoomService,
};
