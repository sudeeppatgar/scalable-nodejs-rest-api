import createApp from "./app/app.js";
import config from "./config/env.js";
import { createMongoDatabase } from "./config/database/index.js";
import redisClient from "./config/redis.js";
import { createServer } from "./app/server.js";

const bootstrap = async () => {
  const app = createApp();
  const database = createMongoDatabase();

  const server = createServer({
    app,
    database,
    redis: redisClient,
    port: config.port,
    env: config.env,
  });

  const shutdown = async (signal) => {
    try {
      await server.stop(signal);
      process.exit(0);
    } catch (err) {
      console.error("❌ Shutdown failed:", err);
      process.exit(1);
    }
  };

  ["SIGINT", "SIGTERM", "unhandledRejection", "uncaughtException"].forEach(
    (event) => process.on(event, shutdown),
  );

  //   process.on("SIGINT", shutdown);
  // process.on("SIGTERM", shutdown);
  // process.on("unhandledRejection", shutdown);
  // process.on("uncaughtException", shutdown);

  await server.start();
};

bootstrap().catch((err) => {
  console.error("❌ Failed to start app:", err);
  process.exit(1);
});
