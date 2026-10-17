import { Server as SocketIOServer, Socket } from "socket.io";
import crypto from "crypto";
import { User, Conversation, Message } from "./shared/models.js";
import { canMessageUser, canAccessConversation } from "./shared/permissions.js";
import { config } from "./config/index.js";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function setupSocketIO(io: SocketIOServer): void {
  // Handshake authentication
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        (socket.handshake.auth?.userId as string) ||
        (socket.handshake.headers["x-user-id"] as string) ||
        config.defaultDemoUserId;

      const user = await User.findById(token);
      if (!user) {
        return next(new Error("Authentication failed: invalid user ID"));
      }

      socket.userId = user._id;
      next();
    } catch (err: any) {
      next(new Error("Authentication error: " + err.message));
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;

    // Suppress transient disconnect and abort errors on client sockets
    socket.on("error", (err: any) => {
      if (err?.code === "ECONNABORTED" || err?.code === "ECONNRESET" || err?.code === "EPIPE") {
        return;
      }
      console.warn(`Socket error for user ${userId}:`, err?.message || err);
    });

    // 1. conversation:join
    socket.on("conversation:join", async (data: { conversationId: string }, callback?: (res: any) => void) => {
      try {
        const { conversationId } = data;
        const conv = await Conversation.findById(conversationId);
        if (!conv) {
          if (callback) callback({ error: "Conversation not found" });
          return;
        }

        if (!canAccessConversation(userId, conv)) {
          if (callback) callback({ error: "Unauthorized conversation access" });
          return;
        }

        const recipientId = conv.participantIds.find((id) => id !== userId);
        if (recipientId && !(await canMessageUser(userId, recipientId))) {
          if (callback) callback({ error: "Messaging requires an accepted connection" });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        if (callback) callback({ success: true, conversationId });
      } catch (err: any) {
        if (callback) callback({ error: err.message });
      }
    });

    // 2. message:send
    socket.on(
      "message:send",
      async (
        data: { conversationId: string; text: string },
        callback?: (res: any) => void
      ) => {
        try {
          const { conversationId, text } = data;
          if (!text || text.trim().length === 0) {
            if (callback) callback({ error: "Message text cannot be empty" });
            return;
          }

          const conv = await Conversation.findById(conversationId);
          if (!conv || !canAccessConversation(userId, conv)) {
            if (callback) callback({ error: "Unauthorized conversation access" });
            return;
          }

          const recipientId = conv.participantIds.find((id) => id !== userId);
          if (!recipientId || !(await canMessageUser(userId, recipientId))) {
            if (callback) callback({ error: "Active accepted connection required" });
            return;
          }

          // Persist message to MongoDB before acknowledgment
          const message = new Message({
            _id: `msg-${crypto.randomBytes(6).toString("hex")}`,
            conversationId,
            senderId: userId,
            text: text.trim(),
            createdAt: new Date(),
          });
          await message.save();

          conv.lastMessageAt = new Date();
          await conv.save();

          // message:ack to sender
          if (callback) {
            callback({
              ack: true,
              messageId: message._id,
              createdAt: message.createdAt,
            });
          }

          // message:new broadcast to room
          io.to(`conversation_${conversationId}`).emit("message:new", {
            id: message._id,
            conversationId,
            senderId: userId,
            text: message.text,
            createdAt: message.createdAt,
          });
        } catch (err: any) {
          if (callback) callback({ error: err.message });
        }
      }
    );
  });
}
