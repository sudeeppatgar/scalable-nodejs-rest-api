import mongoose from "mongoose";
import config from "../../config/env.js";

/**
 * MongoDB database factory
 */
export const createMongoDatabase = () => {
  let connected = false;

  const connect = async () => {
    try {
      const options = {
        ...(config.mongodb?.options || {}),
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(config.mongodb.uri, options);
      connected = true;

      console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);

      mongoose.connection.on("error", (err) => {
        console.error("❌ MongoDB error:", err);
      });

      mongoose.connection.on("disconnected", () => {
        connected = false;
        console.warn("⚠️ MongoDB disconnected");
      });
      ["SIGINT", "SIGTERM"].forEach((signal) => process.on(signal, disconnect));
      // process.on("SIGINT", disconnect);
      // process.on("SIGTERM", disconnect);
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (connected) {
      await mongoose.connection.close();
      connected = false;
      console.log("✅ MongoDB disconnected");
    }
  };

  const isConnected = () => mongoose.connection.readyState === 1;

  return {
    connect,
    disconnect,
    isConnected,
  };
};
