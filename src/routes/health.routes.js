import express from 'express';
import ApiResponse from '../utils/ApiResponse.js';
import { healthCheck } from '../controllers/health.controller.js';
import { apiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

/**
 * Root route
 * Returns a friendly response instead of a 404 for GET /
 */
router.get('/', (req, res) => {
  return ApiResponse.success(200, 'API is running', {
    health: '/health',
    apiBase: '/api',
    setupInstructions: 'See README.md for the full endpoint list and setup guide',
  }).send(res);
});

/**
 * Health Check Routes
 * No authentication required
 */
router.get('/health', apiLimiter(), healthCheck);

export default router;

