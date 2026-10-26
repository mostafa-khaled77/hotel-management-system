const { default: mongoose } = require('mongoose');
const { toJSONPlugin } = require('../config/toJSON.plugin');
const { ROLES } = require('../constants/roles');
const Joi = require('joi');

const UserSchema = new mongoose.Schema(
    {
        googleId: {
            type: String,
            required: true,
            unique: true,
        },
        userName: {
            type: String,
            trim: true,
            required: true,
            minlength: 2,
            maxlength: 40,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            unique: true,
        },
        profileImage: {
            type: String,
            default: '',
            trim: true,
        },
        phone: {
            type: String,
            default: '',
            trim: true,
        },
        role: {
            type: String,
            enum: Object.values(ROLES),
            default: ROLES.GUEST,
        },
    },
    { timestamps: true },
);

function validateUserRegistration(data) {
    const schema = Joi.object({
        googleId: Joi.string().required(),
        userName: Joi.string().required().min(2).max(40),
        email: Joi.string().email().required(),
        profileImage: Joi.string().uri().allow(''),
        phone: Joi.string().allow(''),
    });
    return schema.validate(data);
}

UserSchema.plugin(toJSONPlugin);
const User = mongoose.model('User', UserSchema);

module.exports = {
    User,
    validateUserRegistration,
};
