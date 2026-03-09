import adminService from '../services/admin.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * Admin Controller
 * Handles admin-related HTTP requests
 */
class AdminController {
  /**
   * Get all users (with pagination and filters)
   * GET /api/admin/users
   */
  getAllUsers = asyncHandler(async (req, res) => {
    const queryParams = req.query;
    const result = await adminService.getAllUsers(queryParams);

    return ApiResponse.ok('Users retrieved successfully', result).send(res);
  });

  /**
   * Get user by ID
   * GET /api/admin/users/:id
   */
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await adminService.getUserById(id);

    return ApiResponse.ok('User retrieved successfully', user).send(res);
  });

  /**
   * Update user
   * PATCH /api/admin/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.user._id.toString();

    // Extract metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    const updatedUser = await adminService.updateUser(id, updateData, adminId, metadata);

    return ApiResponse.ok(SUCCESS_MESSAGES.UPDATE_SUCCESS, updatedUser).send(res);
  });

  /**
   * Delete user
   * DELETE /api/admin/users/:id
   */
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id.toString();

    // Extract metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    await adminService.deleteUser(id, adminId, metadata);

    return ApiResponse.ok(SUCCESS_MESSAGES.DELETE_SUCCESS).send(res);
  });

  /**
   * Get user activities
   * GET /api/admin/users/:id/activities
   */
  getUserActivities = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const activities = await adminService.getUserActivities(id, {
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
    });

    return ApiResponse.ok('Activities retrieved successfully', activities).send(res);
  });
}

export default new AdminController();

