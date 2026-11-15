const express = require('express');
const {
    getSelfUser,
    updateUserProfile,
    getAllUsers,
    deleteAnUser,
    getUserById,
    updateUserRole,
} = require('../controllers/userController');
const {
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenAndAuthorization,
} = require('../middlewares/verifyToken');
const validateObjectId = require('../middlewares/validateObjectId');
const router = express.Router();

router.route('/me').get(verifyToken, getSelfUser);
router.route('/updateUser').patch(verifyToken, updateUserProfile);
router.route('/').get(verifyTokenAndAdmin, getAllUsers);
router
    .route('/:id')
    .all(validateObjectId)
    .get(verifyTokenAndAdmin, getUserById)
    .delete(verifyTokenAndAuthorization, deleteAnUser);
router
    .route('/:id/role')
    .patch(validateObjectId, verifyTokenAndAdmin, updateUserRole);

module.exports = router;
