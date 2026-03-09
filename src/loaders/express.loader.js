import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import config from "../config/env.js";

// Routes
import router from "../routes/index.js";
import healthRoutes from "../routes/health.routes.js";

// Middlewares
import {
  errorHandler,
  notFoundHandler,
} from "../middlewares/error.middleware.js";
import { apiLimiter } from "../middlewares/rateLimit.middleware.js";

/**
 * Express Loader
 * Initializes Express app with all middlewares and routes
 * @param {Express} app - Express application instance
 */
const loadExpress = (app) => {
  // Trust proxy (for rate limiting behind reverse proxy)
  app.set("trust proxy", 1);

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    }),
  );

  // Body parser
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Compression
  app.use(compression());
  // Logging
  app.use(morgan(config.env === "development" ? "dev" : "combined"));
  // if (config.env === 'development') {
  //   app.use(morgan('dev'));
  // } else {
  //   app.use(morgan('combined'));
  // }

  // Health check (no rate limiting)
  app.use("/", healthRoutes);

  // API routes with rate limiting

  app.use("/api", router);

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  console.log("✅ Express loaded");
};

export default loadExpress;
