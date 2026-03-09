import { HTTP_STATUS } from './constants.js';

/**
 * Custom API Error class
 * Provides consistent error structure across the application
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '', data = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.data = data;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Create a bad request error
   * @param {string} message
   * @returns {ApiError}
   */
  static badRequest(message) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message);
  }

  /**
   * Create an unauthorized error
   * @param {string} message
   * @returns {ApiError}
   */
  static unauthorized(message = 'Authentication required') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message);
  }

  /**
   * Create a forbidden error
   * @param {string} message
   * @returns {ApiError}
   */
  static forbidden(message = 'Insufficient permissions') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message);
  }

  /**
   * Create a not found error
   * @param {string} message
   * @returns {ApiError}
   */
  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message);
  }

  /**
   * Create a conflict error
   * @param {string} message
   * @returns {ApiError}
   */
  static conflict(message) {
    return new ApiError(HTTP_STATUS.CONFLICT, message);
  }

  /**
   * Create an unprocessable entity error
   * @param {string} message
   * @param {*} data - Additional error data (e.g., validation errors)
   * @returns {ApiError}
   */
  static unprocessableEntity(message, data = null) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, true, '', data);
  }

  /**
   * Create an internal server error
   * @param {string} message
   * @returns {ApiError}
   */
  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, false);
  }
}

export default ApiError;

