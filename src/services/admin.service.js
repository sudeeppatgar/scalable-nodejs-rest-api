import User from '../models/user.model.js';
import Activity from '../models/activity.model.js';
import ApiError from '../utils/ApiError.js';
import { PAGINATION, USER_STATUS } from '../utils/constants.js';

/**
 * Admin Service
 * Handles admin-specific business logic
 */
class AdminService {
  /**
   * Get all users with pagination
   * @param {Object} queryParams - Query parameters
   * @param {number} queryParams.page
   * @param {number} queryParams.limit
   * @param {string} queryParams.search
   * @param {string} queryParams.role
   * @param {string} queryParams.status
   * @returns {Promise<Object>} Paginated users
   */
  async getAllUsers(queryParams = {}) {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search = '',
      role = '',
      status = '',
    } = queryParams;

    // Build query
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitNum = Math.min(parseInt(limit, 10), PAGINATION.MAX_LIMIT);

    // Execute query
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query),
    ]);

    return {
      users: users.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User details
   */
  async getUserById(userId) {
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
   * Update user (admin)
   * @param {string} userId - User ID
   * @param {Object} updateData - Data to update
   * @param {string} adminId - Admin user ID (for logging)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData, adminId, metadata = {}) {
    const { name, email, role, status } = updateData;

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Prevent admin from changing their own role/status
    if (userId === adminId) {
      if (role && role !== user.role) {
        throw ApiError.badRequest('Cannot change your own role');
      }
      if (status && status !== user.status && status === USER_STATUS.SUSPENDED) {
        throw ApiError.badRequest('Cannot suspend your own account');
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.emailExists(email);
      if (emailExists) {
        throw ApiError.conflict('Email already exists');
      }
      user.email = email;
    }
    if (role) user.role = role;
    if (status) user.status = status;

    await user.save();

    // Log admin action
    try {
      await Activity.logActivity({
        userId: adminId,
        action: 'admin_action',
        description: `Admin updated user ${userId}`,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'success',
        metadata: {
          targetUserId: userId,
          updatedFields: Object.keys(updateData),
        },
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
   * Delete user
   * @param {string} userId - User ID to delete
   * @param {string} adminId - Admin user ID (for logging)
   * @param {Object} metadata - Request metadata
   * @returns {Promise<void>}
   */
  async deleteUser(userId, adminId, metadata = {}) {
    // Prevent admin from deleting themselves
    if (userId === adminId) {
      throw ApiError.badRequest('Cannot delete your own account');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    await User.findByIdAndDelete(userId);

    // Log admin action
    try {
      await Activity.logActivity({
        userId: adminId,
        action: 'admin_action',
        description: `Admin deleted user ${userId}`,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        status: 'success',
        metadata: {
          targetUserId: userId,
          deletedUserEmail: user.email,
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Get user activities
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Object[]>} User activities
   */
  async getUserActivities(userId, options = {}) {
    const activities = await Activity.getUserActivities(userId, options);
    return activities;
  }
}

export default new AdminService();

