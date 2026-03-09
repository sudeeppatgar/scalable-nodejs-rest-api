import express from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { apiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = express.Router();

/**
 * Health Check Routes
 * No authentication required
 */
router.get('/health', apiLimiter, healthCheck);

export default router;

