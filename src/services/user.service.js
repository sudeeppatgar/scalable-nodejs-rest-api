import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import ApiError from '../utils/ApiError.js';
import { ERROR_MESSAGES } from '../utils/constants.js';

/**
 * User Service
 * Handles user-related business logic
 */
class UserService {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Update user profile
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updateData, metadata = {}) {
    const { name, email } = updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        throw ApiError.conflict(ERROR_MESSAGES.USER_EXISTS);
      }
      user.email = email;
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    await user.save();

    // Log activity
    try {
      await Activity.logActivity({
        userId: user._id,
        action: 'update_profile',
        description: 'User profile updated',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'success',
        metadata: { updatedFields: Object.keys(updateData) },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isEmailVerified: user.isEmailVerified,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Change user password
   * @param {string} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async changePassword(userId, currentPassword, newPassword, metadata = {}) {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw ApiError.unauthorized('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Log activity
    try {
      await Activity.logActivity({
        userId: user._id,
        action: 'change_password',
        description: 'User password changed',
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'success',
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }
}

export default new UserService();

