const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const getSort = (sortQuery, allowedFields, defaultFields) => {
    if (sortQuery === undefined) return defaultFields;

    const fields = String(sortQuery).split(',');
    const isValidField = fields.some(
        (field) => !allowedFields.includes(field.replace(/^-/, '')),
    );

    if (isValidField) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.VALIDATION_ERROR,
            'Validation failed!',
            [
                {
                    field: 'sort',
                    message: `Must use ${allowedFields.join(' , ')} in Sorting`,
                },
            ],
        );
    }
    return fields.join(' ');
};

module.exports = getSort;
