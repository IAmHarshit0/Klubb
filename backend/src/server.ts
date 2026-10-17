import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { app } from "./app.js";
import { config } from "./config/index.js";
import { connectDB } from "./shared/db.js";
import { setupSocketIO } from "./socket.js";

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ["GET", "POST"],
  },
});

setupSocketIO(io);

async function start() {
  try {
    await connectDB();
    server.listen(config.port, () => {
      console.log(`Server running on http://localhost:${config.port}`);
      console.log(`Socket.IO listening on port ${config.port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") {
  start();
}

export { server, io };
