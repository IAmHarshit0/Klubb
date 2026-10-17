import { beforeAll, afterAll, beforeEach } from "vitest";
import { connectDB, disconnectDB } from "../src/shared/db.js";
import { seedDatabase } from "../src/scripts/seed.js";

const TEST_MONGO_URI = "mongodb://localhost:27017/campus_network_test";

beforeAll(async () => {
  await connectDB(TEST_MONGO_URI);
});

beforeEach(async () => {
  await seedDatabase();
});

afterAll(async () => {
  await disconnectDB();
});
