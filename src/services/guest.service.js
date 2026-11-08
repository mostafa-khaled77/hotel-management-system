const { StatusCodes } = require('http-status-codes');
const { GUEST_SORT } = require('../constants/guestSort');
const { Guest } = require('../models/guest.model');
const AppError = require('../utils/AppError');
const guestFilter = require('../utils/guestFilter');
const getPagination = require('../utils/pagination');
const getSort = require('../utils/sort');
const ERROR_CODES = require('../constants/errorCodes');

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
};
