const express = require('express');
const { successResponse } = require('./middlewares/successResponse');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');
const passport = require('./config/passport');

// Init App
const app = express();

// Apply MiddleWares
app.use(express.json());
app.use(logger);
app.use(successResponse);
app.use(passport.initialize());

// Routes
app.use('/api/v1/rooms', require('./routes/room'));
app.use('/api/v1/auth', require('./routes/auth'));

// Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
