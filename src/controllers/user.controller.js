import userService from '../services/user.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * User Controller
 * Handles user-related HTTP requests
 */
class UserController {
  /**
   * Get current user profile
   * GET /api/users/me
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const profile = await userService.getProfile(userId);

    return ApiResponse.ok('Profile retrieved successfully', profile).send(res);
  });

  /**
   * Update current user profile
   * PATCH /api/users/me
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const updateData = req.body;

    // Extract metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    const updatedProfile = await userService.updateProfile(userId, updateData, metadata);

    return ApiResponse.ok(SUCCESS_MESSAGES.UPDATE_SUCCESS, updatedProfile).send(res);
  });

  /**
   * Change password
   * POST /api/users/me/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const { currentPassword, newPassword } = req.body;

    // Extract metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    await userService.changePassword(userId, currentPassword, newPassword, metadata);

    return ApiResponse.ok('Password changed successfully').send(res);
  });
}

export default new UserController();

