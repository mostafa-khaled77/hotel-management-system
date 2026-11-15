const express = require('express');
const passport = require('passport');
const {
    googleCallback,
    loginFailed,
} = require('../controllers/authController');
const router = express.Router();

router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false,
    }),
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: '/api/v1/auth/login-failed',
    }),
    googleCallback,
);

router.get('/login-failed', loginFailed);
module.exports = router;
