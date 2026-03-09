import db from "../config/database/mongo.database.js";

/**
 * MongoDB Loader
 * Connects to MongoDB database
 * @returns {Promise<void>}
 */
const loadMongo = async () => {
  try {
    await db.connect();
  } catch (error) {
    console.error("❌ MongoDB loader failed:", error);
    throw error;
  }
};

export default loadMongo;
