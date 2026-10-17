import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { app } from "./app.js";
import { config } from "./config/index.js";
import { connectDB } from "./shared/db.js";
import { setupSocketIO } from "./socket.js";

const server = http.createServer(app);

// Handle HTTP client errors gracefully without crashing the process
server.on("clientError", (err: any, socket) => {
  if (err?.code === "ECONNRESET" || err?.code === "ECONNABORTED" || !socket.writable) {
    return;
  }
  socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
});

// Suppress unhandled transient network disconnects on client drop
process.on("uncaughtException", (err: any) => {
  if (err?.code === "ECONNABORTED" || err?.code === "ECONNRESET" || err?.code === "EPIPE") {
    // Expected transient socket aborts on client disconnect (e.g. Windows WSAECONNABORTED)
    return;
  }
  console.error("Uncaught Exception:", err);
});

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      // Reflect requesting origin to allow credentials mode
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSocketIO(io);

async function start() {
  try {
    await connectDB();
    server.listen(config.port, "0.0.0.0", () => {
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
