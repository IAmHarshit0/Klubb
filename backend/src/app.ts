import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { errorHandler } from "./shared/errors.js";
import { usersRouter } from "./modules/users/router.js";
import { feedRouter } from "./modules/feed/router.js";
import { postsRouter } from "./modules/posts/router.js";
import { discoveryRouter } from "./modules/discovery/router.js";
import { connectionsRouter } from "./modules/connections/router.js";
import { institutionsRouter } from "./modules/institutions/router.js";
import { groupsRouter } from "./modules/groups/router.js";
import { messagingRouter } from "./modules/messaging/router.js";
import { moderationRouter } from "./modules/moderation/router.js";
import { followsRouter } from "./modules/follows/router.js";

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests from all origins while supporting credentials
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "healthy",
    service: "Campus Network Backend",
    version: "3.0.0",
    database: "MongoDB",
  });
});

// Mount modular API routers under /api and root
const apiRouters = [
  usersRouter,
  feedRouter,
  postsRouter,
  discoveryRouter,
  connectionsRouter,
  institutionsRouter,
  groupsRouter,
  messagingRouter,
  moderationRouter,
  followsRouter,
];

for (const router of apiRouters) {
  app.use("/api", router);
  app.use("/", router);
}

// Error handling middleware
app.use(errorHandler);
