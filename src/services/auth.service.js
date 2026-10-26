const { StatusCodes } = require('http-status-codes');
const { User } = require('../models/user.model');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const findOrCreateGoogleUser = async (profile) => {
    const googleId = profile.id;
    const email =
        profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (!email) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.BAD_REQUEST,
            'Google account must provide a valid email address.',
        );
    }
    let user = await User.findOne({ googleId });
    if (!user) {
        const name = profile.displayName || 'Google User';
        const userName = name.slice(0, 40);
        user = await User.create({
            googleId,
            userName,
            email,
            profileImage:
                profile.photos && profile.photos[0]
                    ? profile.photos[0].value
                    : '',
        });
    }
    return user;
};

module.exports = {
    findOrCreateGoogleUser,
};
