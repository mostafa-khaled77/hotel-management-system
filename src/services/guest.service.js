const { StatusCodes } = require('http-status-codes');
const { GUEST_SORT } = require('../constants/guestSort');
const { Guest } = require('../models/guest.model');
const AppError = require('../utils/AppError');
const guestFilter = require('../utils/guestFilter');
const getPagination = require('../utils/pagination');
const getSort = require('../utils/sort');
const ERROR_CODES = require('../constants/errorCodes');
const { User } = require('../models/user.model');

const ensureGuestForBookingService = async (userId, session) => {
    const guest = await Guest.findOne({ user: userId }).session(session);
    if (guest) {
        return guest._id;
    }
    const user = await User.findById(userId)
        .session(session)
        .select('firstName lastName email phone')
        .session(session);
    if (!user) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'User Not Found',
        );
    }
    const firstName = user.firstName?.trim();
    const lastName = user.lastName?.trim();
    const phone = user.phone?.trim();
    if (!firstName || !lastName) {
        throw new AppError(
            StatusCodes.BAD_REQUEST,
            ERROR_CODES.BAD_REQUEST,
            'Please complete your account profile with a valid first and last name before booking.',
        );
    }

    const [newGuest] = await Guest.create(
        [
            {
                user: userId,
                firstName,
                lastName,
                email: user.email,
                phone: phone || '',
            },
        ],
        { session },
    );
    return newGuest._id;
};

const getAllGuestsService = async (query) => {
    const { page, limit, skip } = getPagination(query);
    const filter = guestFilter(query);
    const sortBy = getSort(
        query.sort,
        GUEST_SORT.ALLOWED_FIELDS,
        GUEST_SORT.DEFAULT,
    );
    const [guestsList, total] = await Promise.all([
        Guest.find(filter).sort(sortBy).skip(skip).limit(limit),
        Guest.countDocuments(filter),
    ]);
    return {
        guestsList,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const getGuestByIdService = async (guestId) => {
    const guest = await Guest.findById(guestId);
    if (!guest) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Guest not found !',
        );
    }
    return guest;
};

const createNewGuestService = async (guestData) => {
    const guest = new Guest({
        firstName: guestData.firstName,
        lastName: guestData.lastName,
        email: guestData.email,
        phone: guestData.phone,
    });
    return await guest.save();
};

const updateGuestService = async (guestId, guestData) => {
    const updatedGuest = await Guest.findByIdAndUpdate(
        guestId,
        { $set: guestData },
        { returnDocument: 'after', runValidators: true },
    );
    if (!updatedGuest) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Guest not found',
        );
    }
    return updatedGuest;
};

const deleteGuestService = async (guestId) => {
    const deletedGuest = await Guest.findByIdAndDelete(guestId);
    if (!deletedGuest) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Guest Not Found',
        );
    }
    return deletedGuest;
};

module.exports = {
    getAllGuestsService,
    getGuestByIdService,
    createNewGuestService,
    updateGuestService,
    deleteGuestService,
    ensureGuestForBookingService,
};
