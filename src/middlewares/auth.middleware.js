import { verifyAccessToken } from '../utils/token.js';
import User from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import { USER_STATUS } from '../utils/constants.js';

/**
 * Authentication middleware
 * Verifies JWT access token and attaches user to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided');
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const decoded = verifyAccessToken(token);

    // Find user and check if exists and is active
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw ApiError.unauthorized('User account is not active');
    }

    // Attach user to request object
    req.user = user;
    req.token = decoded;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId).select('-password');

      if (user && user.status === USER_STATUS.ACTIVE) {
        req.user = user;
        req.token = decoded;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

export { authenticate, optionalAuth };

