const { StatusCodes } = require('http-status-codes');
const { User } = require('../models/user.model');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');

const findOrCreateGoogleUser = async (profile) => {
    const googleId = profile.id;
    const entryEmail = profile.emails?.[0];
    const email = entryEmail ? entryEmail.value : null;
    const emailVerified = entryEmail?.verified === true;
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
        const firstName = profile.name?.givenName?.trim() || 'Google';
        const lastName = profile.name?.familyName?.trim() || 'User';
        const profileImage =
            profile.photos && profile.photos[0] ? profile.photos[0].value : '';
        user = await User.create({
            googleId,
            firstName,
            lastName,
            email,
            profileImage,
        });
    }
    return user;
};

module.exports = {
    findOrCreateGoogleUser,
};
