import express from "express";
import loadExpress from "../loaders/express.loader.js";

/**
 * Express Application
 * Initializes Express app with middlewares and routes
 * Does NOT start the server (keeps app testable)
 */
const createApp = () => {
  const app = express();
  loadExpress(app);
  return app;
};

export default createApp;
