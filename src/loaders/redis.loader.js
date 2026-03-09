import redisClient from '../config/redis.js';

/**
 * Redis Loader
 * Connects to Redis server
 * @returns {Promise<void>}
 */
const loadRedis = async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis loader failed:', error);
    // Redis is optional, so we don't throw - app can work without it
    console.warn('⚠️  Continuing without Redis (some features may be limited)');
  }
};

export default loadRedis;

