const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const ERROR_CODES = require('../constants/errorCodes');
const { ROLES } = require('../constants/roles');

// Verify Token
const verifyToken = asyncHandler(async (req, res, next) => {
    let token;
    const checkHeader = req.headers.authorization;
    if (checkHeader && checkHeader.startsWith('Bearer')) {
        token = checkHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            'No token provided !',
        );
    }

    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (err) {
        console.log(err);
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            'Token Not Valid !',
        );
    }
});

// Verify Token And Authorization
function verifyTokenAndAuthorization(req, res, next) {
    verifyToken(req, res, (err) => {
        if (err) return next(err);
        if (!req.params || !req.params.id) {
            return next(
                new AppError(
                    StatusCodes.BAD_REQUEST,
                    ERROR_CODES.BAD_REQUEST,
                    'Route Parameter is missing for authorization check ',
                ),
            );
        }
        if (
            req.user &&
            (req.user.id === req.params.id || req.user.role === ROLES.ADMIN)
        ) {
            next();
        } else {
            return next(
                new AppError(
                    StatusCodes.FORBIDDEN,
                    ERROR_CODES.FORBIDDEN,
                    "You're not allowed",
                ),
            );
        }
    });
}

// Verify Token And Admin
function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, (err) => {
        if (err) return next(err);
        if (req.user && req.user.role === ROLES.ADMIN) {
            next();
        } else {
            return next(
                new AppError(
                    StatusCodes.FORBIDDEN,
                    ERROR_CODES.FORBIDDEN,
                    "You're not allowed only admins",
                ),
            );
        }
    });
}

module.exports = {
    verifyToken,
    verifyTokenAndAuthorization,
    verifyTokenAndAdmin,
};
