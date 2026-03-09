import { HTTP_STATUS } from './constants.js';

/**
 * Standardized API Response class
 * Ensures consistent response structure across all endpoints
 */
class ApiResponse {
  constructor(statusCode, message, data = null, success = true) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Send success response
   * @param {Object} res - Express response object
   * @returns {Object}
   */
  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    });
  }

  /**
   * Create a success response
   * @param {number} statusCode
   * @param {string} message
   * @param {*} data
   * @returns {ApiResponse}
   */
  static success(statusCode, message, data = null) {
    return new ApiResponse(statusCode, message, data, true);
  }

  /**
   * Create an OK response (200)
   * @param {string} message
   * @param {*} data
   * @returns {ApiResponse}
   */
  static ok(message, data = null) {
    return new ApiResponse(HTTP_STATUS.OK, message, data, true);
  }

  /**
   * Create a created response (201)
   * @param {string} message
   * @param {*} data
   * @returns {ApiResponse}
   */
  static created(message, data = null) {
    return new ApiResponse(HTTP_STATUS.CREATED, message, data, true);
  }

  /**
   * Create a no content response (204)
   * @param {string} message
   * @returns {ApiResponse}
   */
  static noContent(message = 'No content') {
    return new ApiResponse(HTTP_STATUS.NO_CONTENT, message, null, true);
  }
}

export default ApiResponse;

