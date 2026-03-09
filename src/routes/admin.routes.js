import express from 'express';
import { body, query } from 'express-validator';
import adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { adminOnly } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { apiLimiter } from '../middlewares/rateLimit.middleware.js';
import { USER_ROLES, USER_STATUS } from '../utils/constants.js';

const router = express.Router();

/**
 * Admin Routes
 * All routes require authentication and admin role
 */
router.use(authenticate);
router.use(adminOnly);
router.use(apiLimiter);

// Get all users - GET /api/admin/users
router.get(
  '/users',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('search')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Search term cannot exceed 100 characters'),
    query('role')
      .optional()
      .isIn(Object.values(USER_ROLES))
      .withMessage('Invalid role'),
    query('status')
      .optional()
      .isIn(Object.values(USER_STATUS))
      .withMessage('Invalid status'),
  ],
  validate,
  adminController.getAllUsers
);

// Get user by ID - GET /api/admin/users/:id
router.get('/users/:id', adminController.getUserById);

// Update user - PATCH /api/admin/users/:id
router.patch(
  '/users/:id',
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('role')
      .optional()
      .isIn(Object.values(USER_ROLES))
      .withMessage('Invalid role'),
    body('status')
      .optional()
      .isIn(Object.values(USER_STATUS))
      .withMessage('Invalid status'),
  ],
  validate,
  adminController.updateUser
);

// Delete user - DELETE /api/admin/users/:id
router.delete('/users/:id', adminController.deleteUser);

// Get user activities - GET /api/admin/users/:id/activities
router.get(
  '/users/:id/activities',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('skip')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Skip must be a non-negative integer'),
  ],
  validate,
  adminController.getUserActivities
);

export default router;

