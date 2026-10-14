const asyncHandler = require('express-async-handler');
const getPagination = require('../utils/pagination');
const {
    Guest,
    validateCreateGuest,
    validateUpdateGuest,
} = require('../models/guest.model');
const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const validationError = require('../utils/validationError');
const guestFilter = require('../utils/guestFilter');

/**
 * @desc    Get All Guests
 * @route   api/v1/guests
 * @method  GET
 *  @access  public
 */

const getAllGuests = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = guestFilter(req.query);
    const sortBy = req.query.sort || 'lastName firstName';
    const guestsList = await Guest.find(filter)
        .sort(sortBy)
        .skip(skip)
        .limit(limit);
    const total = await Guest.countDocuments(filter);
    res.success(guestsList, StatusCodes.OK, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    });
});

/**
 * @desc    Find Guests By Id
 * @route   api/v1/guests/:id
 * @method  GET
 *  @access  public
 */

const getGuestById = asyncHandler(async (req, res) => {
    const guest = await Guest.findById(req.params.id);
    if (!guest) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Guest not found !',
        );
    }
    res.success(guest);
});

/**
 * @desc    Create New Guests
 * @route   api/v1/guests
 * @method  POST
 *  @access  public
 */

const createNewGuest = asyncHandler(async (req, res, next) => {
    const { error } = validateCreateGuest(req.body);
    if (error) {
        return next(validationError(error));
    }
    const guest = new Guest({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
    });

    const result = await guest.save();
    res.success(result, StatusCodes.CREATED);
});

/**
 * @desc    Update Guests
 * @route   api/v1/guests/:id
 * @method  PATCH
 *  @access  public
 */

const updateGuest = asyncHandler(async (req, res, next) => {
    const { error } = validateUpdateGuest(req.body);
    if (error) {
        return next(validationError(error));
    }
    const updatedGuest = await Guest.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { returnDocument: 'after', runValidators: true },
    );
    if (!updatedGuest) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Guest not found',
        );
    }
    res.success(updatedGuest);
});

/**
 * @desc    Delete Guests
 * @route   api/v1/guests/:id
 * @method  Delete
 *  @access  public
 */

const deleteGuest = asyncHandler(async (req, res) => {
    const deletedGuest = await Guest.findByIdAndDelete(req.params.id);
    if (!deletedGuest) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'Guest Not Found',
        );
    }
    res.status(StatusCodes.NO_CONTENT).send();
});

module.exports = {
    getAllGuests,
    createNewGuest,
    getGuestById,
    updateGuest,
    deleteGuest,
};
