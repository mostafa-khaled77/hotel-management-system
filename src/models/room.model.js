const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: ['Single', 'Double'],
        },
        roomNumber: {
            type: Number,
            required: true,
            unique: true,
        },
        price: {
            type: Number,
            min: 0,
            required: true,
        },
        capacity: {
            type: Number,
            min: 1,
            required: true,
        },
        floor: {
            type: Number,
        },
        description: {
            type: String,
            trim: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Room = mongoose.model('Room', RoomSchema);

module.exports = {
    Room,
};
