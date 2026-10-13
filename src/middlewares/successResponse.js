const { StatusCodes } = require('http-status-codes');

module.exports.successResponse = (req, res, next) => {
    res.success = function (data, statusCode = StatusCodes.OK, pagination) {
        const body = { data };

        if (pagination) {
            body.pagination = pagination;
        }

        res.status(statusCode).json(body);
    };
    next();
};
