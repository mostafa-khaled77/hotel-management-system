const { StatusCodes } = require('http-status-codes');
const { User } = require('../models/user.model');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const findOrCreateGoogleUser = async (profile) => {
    const googleId = profile.id;
    const entryEmail = profile.emails && profile.emails[0];
    const email = entryEmail ? entryEmail.value : null;
    const emailVerified = entryEmail ? entryEmail.verified !== false : false;
    if (!email) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.BAD_REQUEST,
            'Google account must provide a valid email address.',
        );
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
        if (!user.googleId) {
            if (!emailVerified) {
                throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    ERROR_CODES.BAD_REQUEST,
                    'Email is not verified',
                );
            }
            user.googleId = googleId;
            await user.save();
        }
    } else {
        let userName = profile.displayName || 'Google User';
        if (userName.trim().length < 2) {
            userName = userName + '_User';
        }
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
