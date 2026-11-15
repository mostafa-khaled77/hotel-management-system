const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const ERROR_CODES = require('../constants/errorCodes');
const { User, validateUpdateUserRole } = require('../models/user.model');
const { validateUpdateUser } = require('../models/user.model');
const validationError = require('../utils/validationError');
const getPagination = require('../utils/pagination');

// Get User Profile
const getSelfUserService = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'User Not Found',
        );
    }
    return user;
};

// Update User
const updateUserService = async (userId, body) => {
    const { error } = validateUpdateUser(body);
    if (error) {
        throw validationError(error);
    }
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: body },
        { returnDocument: 'after', runValidators: true },
    );

    if (!updatedUser) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'User Not Found',
        );
    }
    return updatedUser;
};

// Get All Users
const getAllUsersService = async (query) => {
    const { page, limit, skip } = getPagination(query);
    const [users, total] = await Promise.all([
        User.find().skip(skip).limit(limit),
        User.countDocuments(),
    ]);
    return {
        data: users,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
};

// Delete An user
const deleteUsersService = async (userId) => {
    const deleteUser = await User.findByIdAndDelete(userId);
    if (!deleteUser) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'User Not Found',
        );
    }
    return deleteUser;
};

// Get User By Id
const getUserByIdService = async (userId) => {
    const getSpecificUser = await User.findById(userId);
    if (!getSpecificUser) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'User Not Found',
        );
    }
    return getSpecificUser;
};

// Update User Role
const updateUserRoleService = async (userId, role) => {
    const { error } = validateUpdateUserRole({ role });
    if (error) {
        throw validationError(error);
    }
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { role },
        { returnDocument: 'after', runValidators: true },
    );
    if (!updatedUser) {
        throw new AppError(
            StatusCodes.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            'User Not Found',
        );
    }
    return updatedUser;
};

module.exports = {
    getSelfUserService,
    updateUserService,
    getAllUsersService,
    deleteUsersService,
    getUserByIdService,
    updateUserRoleService,
};
