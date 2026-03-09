import { createClient } from 'redis';
import config from './env.js';

/**
 * Redis client configuration
 * Handles connection, error handling, and graceful shutdown
 */
class RedisClient {
  constructor() {
    this.client = null;
  }

  /**
   * Create and connect Redis client
   * @returns {Promise<void>}
   */
  async connect() {
    try {
      const redisConfig = {
        socket: {
          host: config.redis.host,
          port: config.redis.port,
        },
        database: config.redis.db,
      };

      if (config.redis.password) {
        redisConfig.password = config.redis.password;
      }

      this.client = createClient(redisConfig);

      // Error handling
      this.client.on('error', (err) => {
        console.error('❌ Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        console.log('🔄 Redis connecting...');
      });

      this.client.on('ready', () => {
        console.log('✅ Redis connected');
      });

      this.client.on('end', () => {
        console.warn('⚠️  Redis connection ended');
      });

      await this.client.connect();

      // Graceful shutdown
      process.on('SIGINT', this.disconnect.bind(this));
      process.on('SIGTERM', this.disconnect.bind(this));
    } catch (error) {
      console.error('❌ Redis connection failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect Redis client
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.client) {
      await this.client.quit();
      console.log('✅ Redis disconnected');
      this.client = null;
    }
  }

  /**
   * Get Redis client instance
   * @returns {RedisClientType|null}
   */
  getClient() {
    return this.client;
  }

  /**
   * Check if Redis is connected
   * @returns {boolean}
   */
  isConnected() {
    return this.client && this.client.isReady;
  }
}

export default new RedisClient();

