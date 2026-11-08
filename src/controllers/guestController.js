const asyncHandler = require('express-async-handler');
const {
    validateCreateGuest,
    validateUpdateGuest,
} = require('../models/guest.model');
const { StatusCodes } = require('http-status-codes');
const validationError = require('../utils/validationError');
const {
    getAllGuestsService,
    getGuestByIdService,
    createNewGuestService,
    updateGuestService,
    deleteGuestService,
} = require('../services/guest.service');

/**
 * @desc    Get All Guests
 * @route   api/v1/guests
 * @method  GET
 *  @access  private(only admins)
 */
const getAllGuests = asyncHandler(async (req, res) => {
    const { guestsList, pagination } = await getAllGuestsService(req.query);
    res.success(guestsList, StatusCodes.OK, pagination);
});

/**
 * @desc    Find Guests By Id
 * @route   api/v1/guests/:id
 * @method  GET
 *  @access  private(only admins)
 */
const getGuestById = asyncHandler(async (req, res) => {
    const guest = await getGuestByIdService(req.params.id);
    res.success(guest);
});

/**
 * @desc    Create New Guests
 * @route   api/v1/guests
 * @method  POST
 *  @access  private(only admins)
 */
const createNewGuest = asyncHandler(async (req, res, next) => {
    const { error } = validateCreateGuest(req.body);
    if (error) {
        return next(validationError(error));
    }
    const result = await createNewGuestService(req.body);
    res.success(result, StatusCodes.CREATED);
});

/**
 * @desc    Update Guests
 * @route   api/v1/guests/:id
 * @method  PATCH
 *  @access  private(only admins)
 */
const updateGuest = asyncHandler(async (req, res, next) => {
    const { error } = validateUpdateGuest(req.body);
    if (error) {
        return next(validationError(error));
    }
    const updatedGuest = await updateGuestService(req.params.id, req.body);
    res.success(updatedGuest);
});

/**
 * @desc    Delete Guests
 * @route   api/v1/guests/:id
 * @method  Delete
 *  @access  private(only admins)
 */
const deleteGuest = asyncHandler(async (req, res) => {
    const deletedGuest = await deleteGuestService(req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
});

module.exports = {
    getAllGuests,
    createNewGuest,
    getGuestById,
    updateGuest,
    deleteGuest,
};
