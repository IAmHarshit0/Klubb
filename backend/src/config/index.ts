import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/campus_network",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  nodeEnv: process.env.NODE_ENV || "development",
  defaultDemoUserId: process.env.DEFAULT_DEMO_USER_ID || "usr-student-001",
  flashrankServiceUrl: process.env.FLASHRANK_SERVICE_URL || "http://127.0.0.1:8000",
  flashrankTimeoutMs: parseInt(process.env.FLASHRANK_TIMEOUT_MS || "200", 10),
};
