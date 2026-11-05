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

  let shuttingDown = false;

  const shutdown = async (signal, exitCode = 0, err = null) => {
    if (shuttingDown) return;
    shuttingDown = true;

    if (err) {
      console.error(`❌ ${signal}:`, err);
    }

    try {
      await server.stop(signal);
      process.exit(exitCode);
    } catch (shutdownErr) {
      console.error("❌ Shutdown failed:", shutdownErr);
      process.exit(1);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT", 0));
  process.on("SIGTERM", () => shutdown("SIGTERM", 0));
  process.on("unhandledRejection", (reason) =>
    shutdown("unhandledRejection", 1, reason),
  );
  process.on("uncaughtException", (err) =>
    shutdown("uncaughtException", 1, err),
  );

  await server.start();
};

bootstrap().catch((err) => {
  console.error("❌ Failed to start app:", err);
  process.exit(1);
});
