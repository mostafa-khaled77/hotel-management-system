const AppError = require('../utils/appError');

const notFound = (req, res, next) => {
    next(new AppError(404, 'NOT_FOUND', `Can't Find this ${req.originalUrl}`));
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let code = err.code || 'INTERNAL_SERVER_ERROR';
    let message = err.message || 'SomeThing Went Wrong';
    let details = err.details || [];

    res.status(statusCode).json({ error: { code, message, details } });
};

module.exports = {
    notFound,
    errorHandler,
};
