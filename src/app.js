const express = require('express');
const { successResponse } = require('./middlewares/successResponse');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');
const cookieParser = require('cookie-parser');
require('./config/passport');

// Init App
const app = express();

// Apply MiddleWares
app.use(express.json());
app.use(cookieParser());
app.use(logger);
app.use(successResponse);

// Routes
app.use('/api/v1/rooms', require('./routes/room'));
app.use('/api/v1/guests', require('./routes/guest'));
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/users', require('./routes/user'));

// Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
