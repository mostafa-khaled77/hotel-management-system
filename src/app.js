const express = require('express');
const { successResponse } = require('./middlewares/successResponse');
const { errorHandler, notFound } = require('./middlewares/errorHandler');
const logger = require('./middlewares/logger');

// Init App
const app = express();

// Apply MiddleWares
app.use(express.json());
app.use(logger);
app.use(successResponse);

// Routes
app.use('/api/v1/rooms', require('./routes/room'));

// Error Handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
