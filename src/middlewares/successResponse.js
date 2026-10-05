module.exports.successResponse = (req, res, next) => {
    res.success = function (data, statusCode = 200, pagination) {
        const body = { data };

        if (pagination) {
            body.pagination = pagination;
        }

        res.status(statusCode).json(body);
    };
    next();
};
