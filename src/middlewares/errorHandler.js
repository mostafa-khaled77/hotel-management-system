const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const notFound = (req, res, next) => {
    next(
        new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            `Can't find this ${req.originalUrl}`
        )
    );
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    let code = err.code || ERROR_CODES.INTERNAL_SERVER_ERROR;
    let message = err.statusCode ? err.message : 'Something went wrong.';
    const details = err.details || [];

    if (err.code === 11000) {
        statusCode = StatusCodes.CONFLICT;
        code = ERROR_CODES.DUPLICATE_KEY;
        message = 'Room number already exists';
    }

    res.status(statusCode).json({ error: { code, message, details } });
};

module.exports = {
    notFound,
    errorHandler,
};
