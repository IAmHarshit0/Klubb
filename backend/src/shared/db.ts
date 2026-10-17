import mongoose from "mongoose";
import { config } from "../config/index.js";

export async function connectDB(uri: string = config.mongoUri): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log(`Connected to MongoDB at ${uri}`);
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
