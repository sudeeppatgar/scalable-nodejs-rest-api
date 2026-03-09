import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import redisClient from '../config/redis.js';

/**
 * Health Check Controller
 * Provides system health status
 */
const healthCheck = asyncHandler(async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: redisClient.isConnected() ? 'connected' : 'disconnected',
    },
  };

  // Determine overall status
  const allServicesHealthy =
    health.services.database === 'connected' &&
    health.services.redis === 'connected';

  const statusCode = allServicesHealthy ? 200 : 503;
  health.status = allServicesHealthy ? 'ok' : 'degraded';

  return ApiResponse.success(statusCode, 'Health check completed', health).send(res);
});

export { healthCheck };
