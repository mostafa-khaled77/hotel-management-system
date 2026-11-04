const asyncHandler = require('express-async-handler');
const { getSelfUserService, updateUserService, getAllUsersService ,deleteUsersService, getUserByIdService, updateUserRoleService } = require('../services/user.service');
const { StatusCodes } = require('http-status-codes');


/**
 * @desc  Get User Profile   
 * @route /api/v1/users/me
 * @method GET
 * @access private(only user itself)
 */
const getSelfUser = asyncHandler(async (req, res) => {
    const user = await getSelfUserService(req.user.id);
    res.success(user);
});


/**
 * @desc  Update User
 * @route /api/v1/users/updateUser
 * @method PATCH
 * @access private(only user itself)
 */
const updateUserProfile = asyncHandler(async (req, res) => {
    const updatedUser = await updateUserService(req.user.id, req.body);
    res.success(updatedUser, StatusCodes.OK);
});


/**
 * @desc  Get All Users
 * @route /api/v1/users
 * @method GET
 * @access private(only Admins)
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const { data, pagination } = await getAllUsersService(req.query);
    res.success(data, StatusCodes.OK, pagination);
});


/**
 * @desc  Delete User
 * @route /api/v1/users/:id
 * @method DELETE
 * @access private(only Admins or User Itself)
 */
const deleteAnUser = asyncHandler(async (req, res) => {
    const deleteUser = await deleteUsersService(req.params.id);
    res.status(StatusCodes.NO_CONTENT).send();
});


/**
 * @desc  Get User By Id
 * @route /api/v1/users/:id
 * @method GET
 * @access private(only Admins)
 */
const getUserById = asyncHandler(async (req, res) => {
    const getSpecificUser = await getUserByIdService(req.params.id);
    res.success(getSpecificUser);
});



/**
 * @desc  Update User Role
 * @route /api/v1/users/:id/role
 * @method PATCH
 * @access private(only Admins)
 */
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;
    const updatedUser = await updateUserRoleService(req.params.id , role)
    res.success(updatedUser);
});

module.exports = {
    getSelfUser,
    updateUserProfile,
    getAllUsers,
    deleteAnUser,
    getUserById,
    updateUserRole,
};
