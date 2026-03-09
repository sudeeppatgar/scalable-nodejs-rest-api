import authService from '../services/auth.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { SUCCESS_MESSAGES } from '../utils/constants.js';

/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */
class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    // Extract metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    const result = await authService.register({ name, email, password }, metadata);

    return ApiResponse.created(SUCCESS_MESSAGES.REGISTER_SUCCESS, result).send(res);
  });

  /**
   * Login user
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Extract metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    const result = await authService.login({ email, password }, metadata);

    return ApiResponse.ok(SUCCESS_MESSAGES.LOGIN_SUCCESS, result).send(res);
  });

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await authService.refreshToken(refreshToken);

    return ApiResponse.ok('Token refreshed successfully', result).send(res);
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();

    // Extract metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    await authService.logout(userId, metadata);

    return ApiResponse.ok(SUCCESS_MESSAGES.LOGOUT_SUCCESS).send(res);
  });
}

export default new AuthController();

