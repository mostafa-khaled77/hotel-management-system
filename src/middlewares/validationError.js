const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const validationError = (error) => {
    const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message,
    }));
    return new AppError(
        StatusCodes.BAD_REQUEST,
        ERROR_CODES.VALIDATION_ERROR,
        'Validation Failed !',
        details
    );
};
module.exports = validationError;
