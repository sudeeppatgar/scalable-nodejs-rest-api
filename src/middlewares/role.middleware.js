import ApiError from '../utils/ApiError.js';
import { USER_ROLES } from '../utils/constants.js';

/**
 * Role-based authorization middleware
 * Restricts access based on user roles
 *
 * @param {...string} allowedRoles - Roles that are allowed to access
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should be set by auth middleware)
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden('You do not have permission to access this resource')
      );
    }

    next();
  };
};

/**
 * Admin-only middleware
 * Shorthand for authorize(USER_ROLES.ADMIN)
 */
const adminOnly = authorize(USER_ROLES.ADMIN);

export { authorize, adminOnly };

