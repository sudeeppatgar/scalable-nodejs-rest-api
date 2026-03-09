import ApiError from '../utils/ApiError.js';
import config from '../config/env.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

/**
 * Global error handling middleware
 * Centralized error handling for all routes
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an ApiError, convert it
  if (!(error instanceof ApiError)) {
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors)
        .map((e) => e.message)
        .join(', ');
      error = ApiError.badRequest(message);
    }
    // Mongoose duplicate key error
    else if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      error = ApiError.conflict(`${field} already exists`);
    }
    // Mongoose cast error (invalid ObjectId)
    else if (error.name === 'CastError') {
      error = ApiError.notFound('Invalid resource ID');
    }
    // JWT errors
    else if (error.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Token expired');
    }
    // Default to internal server error
    else {
      error = ApiError.internal(
        config.env === 'development' ? error.message : ERROR_MESSAGES.INTERNAL_ERROR
      );
    }
  }

  // Log error in development
  if (config.env === 'development') {
    console.error('Error:', error);
  }

  // Send error response
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.INTERNAL_ERROR;

  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // Include validation errors if present
  if (error.data) {
    response.errors = error.data;
  }

  // Include stack trace in development
  if (config.env === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 * Catches all unmatched routes
 */
const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`Route ${req.originalUrl} not found`);
  next(error);
};

export { errorHandler, notFoundHandler };

