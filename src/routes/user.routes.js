import express from 'express';
import { body } from 'express-validator';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { apiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

/**
 * User Routes
 * All routes require authentication
 */
router.use(authenticate);
router.use(apiLimiter);

// Get current user profile - GET /api/users/me
router.get('/me', userController.getProfile);

// Update current user profile - PATCH /api/users/me
router.patch(
  '/me',
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
  ],
  validate,
  userController.updateProfile
);

// Change password - POST /api/users/me/change-password
router.post(
  '/me/change-password',
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  validate,
  userController.changePassword
);

export default router;

