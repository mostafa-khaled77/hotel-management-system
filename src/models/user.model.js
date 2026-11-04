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
            default: ROLES.User,
        },
    },
    { timestamps: true },
);

UserSchema.plugin(toJSONPlugin);
const User = mongoose.model('User', UserSchema);

function validateUpdateUser(obj) {
    const schema = Joi.object({
        userName: Joi.string().trim().min(2).max(40),
        profileImage: Joi.string().trim().allow(''),
        phone: Joi.string().trim().allow(''),
    }).min(1);

    return schema.validate(obj, { abortEarly: false });
}

module.exports = {
    User,
    validateUpdateUser,
};
