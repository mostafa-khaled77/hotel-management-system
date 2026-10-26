const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');
const ERROR_CODES = require('../constants/errorCodes');

// Verify Token
const verifyToken = asyncHandler(async (req, res, next) => {
    const checkHeader = req.headers.authorization;
    if (!checkHeader || !checkHeader.startsWith('Bearer')) {
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            'No token provided !',
        );
    }
    const token = checkHeader.split(' ')[1];
    if (token) {
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
    } else {
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            'No token provided !',
        );
    }
});

// Verify Token And Authorization
function verifyTokenAndAuthorization(req, res, next) {
    verifyToken(req, res, (err) => {
        if (err) return next(err);
        if (req.user && (req.user.id === req.params.id || req.user.role === 'admin')) {
            next();
        } else {
            return next(
                new AppError(
                    StatusCodes.FORBIDDEN,
                    ERROR_CODES.FORBIDDEN,
                    "You're not allowed",
                )
            );
        }
    });
}

// Verify Token And Admin
function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, (err) => {
        if (err) return next(err);
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return next(
                new AppError(
                    StatusCodes.FORBIDDEN,
                    ERROR_CODES.FORBIDDEN,
                    "You're not allowed only admins",
                )
            );
        }
    });
}

module.exports = {
    verifyToken,
    verifyTokenAndAuthorization,
    verifyTokenAndAdmin,
};