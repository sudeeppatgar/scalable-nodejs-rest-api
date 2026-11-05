import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import config from '../config/env.js';
import redisClient from '../config/redis.js';

/**
 * Builds an express-rate-limit limiter backed by Redis when available
 * so counters are shared across app instances. Falls back to the
 * default in-memory store otherwise.
 */
const createlimiter = (name, options) => {
  const store = redisClient.isConnected()
    ? new RedisStore({
        sendCommand: (...args) => redisClient.getClient().sendCommand(args),
        prefix: `rl:${name}:`,
      })
    : undefined;

  return rateLimit({ ...options, store });
};

const limiterCache = new Map();

/**
 * Returns a cached limiter, creating it on first invocation
 * (after the server has connected to Redis).
 */
const getLimiter = (name, options) => {
  if (!limiterCache.has(name)) {
    limiterCache.set(name, createlimiter(name, options));
  }
  return limiterCache.get(name);
};

/**
 * General API rate limiter
 * Protects all API endpoints from abuse
 */
export function apiLimiter() {
  return getLimiter('api', {
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use IP address as key
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  });
}

/**
 * Strict rate limiter for authentication endpoints
 * More restrictive to prevent brute force attacks
 */
export function authLimiter() {
  return getLimiter('auth', {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  });
}

/**
 * Strict rate limiter for registration
 * Prevents spam registrations
 */
export function registerLimiter() {
  return getLimiter('register', {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: {
      success: false,
      message: 'Too many registration attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  });
}
