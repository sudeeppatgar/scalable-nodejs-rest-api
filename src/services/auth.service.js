import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import redisClient from '../config/redis.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/token.js';
import ApiError from '../utils/ApiError.js';
import { REDIS_KEYS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * Authentication Service
 * Handles all authentication business logic
 */
class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @param {string} userData.name
   * @param {string} userData.email
   * @param {string} userData.password
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} User and tokens
   */
  async register(userData, metadata = {}) {
    const { name, email, password } = userData;

    // Check if user already exists
    const emailExists = await User.emailExists(email);
    if (emailExists) {
      throw ApiError.conflict(ERROR_MESSAGES.USER_EXISTS);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in Redis
    if (redisClient.isConnected()) {
      const refreshKey = REDIS_KEYS.REFRESH_TOKEN(user._id.toString());
      await redisClient.getClient().setEx(
        refreshKey,
        30 * 24 * 60 * 60, // 30 days in seconds
        refreshToken
      );
    }

    // Log activity
    try {
      await Activity.logActivity({
        userId: user._id,
        action: 'register',
        description: 'User registered successfully',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'success',
      });
    } catch (error) {
      // Don't fail registration if activity logging fails
      console.error('Failed to log registration activity:', error);
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @param {Object} metadata - Request metadata (ip, userAgent)
   * @returns {Promise<Object>} User and tokens
   */
  async login(credentials, metadata = {}) {
    const { email, password } = credentials;

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw ApiError.unauthorized(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      try {
        await Activity.logActivity({
          userId: user._id,
          action: 'login',
          description: 'Failed login attempt - invalid password',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
          status: 'failed',
        });
      } catch (error) {
        console.error('Failed to log activity:', error);
      }

      throw ApiError.unauthorized(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = generateRefreshToken(user._id.toString());

    // Store refresh token in Redis
    if (redisClient.isConnected()) {
      const refreshKey = REDIS_KEYS.REFRESH_TOKEN(user._id.toString());
      await redisClient.getClient().setEx(
        refreshKey,
        30 * 24 * 60 * 60, // 30 days in seconds
        refreshToken
      );
    }

    // Log successful login
    try {
      await Activity.logActivity({
        userId: user._id,
        action: 'login',
        description: 'User logged in successfully',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New access token
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Check if refresh token exists in Redis
    if (redisClient.isConnected()) {
      const refreshKey = REDIS_KEYS.REFRESH_TOKEN(decoded.userId);
      const storedToken = await redisClient.getClient().get(refreshKey);

      if (!storedToken || storedToken !== refreshToken) {
        throw ApiError.unauthorized('Invalid refresh token');
      }
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id.toString(), user.email, user.role);

    return {
      accessToken,
    };
  }

  /**
   * Logout user
   * @param {string} userId - User ID
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async logout(userId, metadata = {}) {
    // Remove refresh token from Redis
    if (redisClient.isConnected()) {
      const refreshKey = REDIS_KEYS.REFRESH_TOKEN(userId);
      await redisClient.getClient().del(refreshKey);
    }

    // Log logout activity
    try {
      await Activity.logActivity({
        userId,
        action: 'logout',
        description: 'User logged out successfully',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

export default new AuthService();

