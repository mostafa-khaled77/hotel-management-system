const asyncHandler = require('express-async-handler');
const AppError = require('../utils/AppError');
const { StatusCodes } = require('http-status-codes');
const ERROR_CODES = require('../constants/errorCodes');
const generateToken = require('../utils/jwt');
const googleCallback = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user) {
        throw new AppError(
            StatusCodes.UNAUTHORIZED,
            ERROR_CODES.UNAUTHORIZED,
            'UnAuthenticated',
        );
    }
    const token = generateToken(user);
    res.success(
        {
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                userName: user.userName,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                phone: user.phone,
            },
        },
        StatusCodes.OK,
    );
});

const loginFailed = asyncHandler(async () => {
    throw new AppError(
        StatusCodes.UNAUTHORIZED,
        ERROR_CODES.UNAUTHORIZED,
        'Google authentication failed or was cancelled.',
    );
});

module.exports = {
    loginFailed,
    googleCallback,
};
