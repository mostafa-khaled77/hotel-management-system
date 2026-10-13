const { StatusCodes } = require('http-status-codes');
const AppError = require('./AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { PAGINATION } = require('../constants/pagination');

const parsePositiveInt = (value, field, defaultValue) => {
    if (value === undefined) return defaultValue;
    const number = Number(value);
    if (!Number.isInteger(number) || number < 1) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
            'Validation Error !',
            [{ field, message: `${field} must be postive integer` }],
        );
    }
    return number;
};

const getPagination = (query) => {
    const page = parsePositiveInt(query.page, 'page', PAGINATION.DEFAULT_PAGE);
    const requestedLimit = parsePositiveInt(
        query.limit,
        'limit',
        PAGINATION.DEFAULT_LIMIT,
    );
    const limit = Math.min(requestedLimit, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

module.exports = getPagination;
