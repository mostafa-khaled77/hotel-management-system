const Joi = require('joi');
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
    {
        roomType: {
            type: String,
            required: true,
            enum: ['Single', 'Double'],
        },
        roomNumber: {
            type: Number,
            required: true,
            min: 1,
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

// Validate Create Room
function validateCreateRoom(obj) {
    const schema = Joi.object({
        roomType: Joi.string().valid('Single', 'Double').required(),
        roomNumber: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
        capacity: Joi.number().integer().min(1).required(),
        floor: Joi.number().integer().optional(),
        description: Joi.string().required(),
        isAvailable: Joi.boolean().optional(),
    });
    return schema.validate(obj);
}

// Validate Update Room
function validateUpdateRoom(obj) {
    const schema = Joi.object({
        roomType: Joi.string().valid('Single', 'Double'),
        roomNumber: Joi.number().integer().min(1),
        price: Joi.number().min(0),
        capacity: Joi.number().integer().min(1),
        floor: Joi.number().integer(),
        description: Joi.string(),
        isAvailable: Joi.boolean(),
    });
    return schema.validate(obj);
}

RoomSchema.set('toJSON', {
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = {
    Room,
    validateCreateRoom,
    validateUpdateRoom,
};
