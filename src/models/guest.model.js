const Joi = require('joi');
const { default: mongoose } = require('mongoose');
const { toJSONPlugin } = require('../config/toJSON.plugin');

const GuestSchema = mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
        },
        phone: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true },
);

// Validate Create Guest
function validateCreateGuest(obj) {
    const schema = Joi.object({
        firstName: Joi.string().trim().required(),
        lastName: Joi.string().trim().required(),
        email: Joi.string().email().trim().optional(),
        phone: Joi.string()
            .trim()
            .optional()
            .pattern(/^01[0125][0-9]{8}$/)
            .message('Please Enter Valid Egyptain Number')
            .allow('', null),
    }).or('email', 'phone');
    return schema.validate(obj, { abortEarly: false });
}

// Validate Update Guest
function validateUpdateGuest(obj) {
    const schema = Joi.object({
        firstName: Joi.string().trim(),
        lastName: Joi.string().trim(),
        email: Joi.string().email().trim(),
        phone: Joi.string().trim(),
    }).min(1);
    return schema.validate(obj, { abortEarly: false });
}

GuestSchema.plugin(toJSONPlugin);

const Guest = mongoose.model('Guest', GuestSchema);

module.exports = {
    Guest,
    validateCreateGuest,
    validateUpdateGuest,
};
