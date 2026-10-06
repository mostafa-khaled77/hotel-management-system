const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
    next(new AppError(404, 'NOT_FOUND', `Can't Find this ${req.originalUrl}`));
};



// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_SERVER_ERROR';
    let message = err.message || 'SomeThing Went Wrong';
    const details = err.details || [];

    if (err.name === 'CastError') {
        statusCode = 400;
        code = 'INVALID_ID';
        message = 'Invalid Id Please enter valid id';
    } else if (err.code === 11000) {
        statusCode = 409;
        code = 'DUPLICATED_KEY';
        message = 'Room number already exists';
    }

    res.status(statusCode).json({ error: { code, message, details } });
};

module.exports = {
    notFound,
    errorHandler,
};
