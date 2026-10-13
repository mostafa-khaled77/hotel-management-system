const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { default: mongoose } = require('mongoose');

const validateObjectId = (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(
            new AppError(
                StatusCodes.BAD_REQUEST,
                ERROR_CODES.INVALID_ID,
                'Invalid id please enter valid id',
            ),
        );
    }
    next();
};

module.exports = validateObjectId;
