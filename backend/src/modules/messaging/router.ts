import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import { Conversation, Message, User } from "../../shared/models.js";
import { canMessageUser, canAccessConversation } from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";

export const messagingRouter = Router();

// GET /api/conversations
messagingRouter.get("/conversations", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerId = req.user!._id;
    const conversations = await Conversation.find({
      participantIds: viewerId,
    }).sort({ lastMessageAt: -1 });

    const otherUserIds = Array.from(
      new Set(
        conversations.flatMap((c) => c.participantIds.filter((id) => id !== viewerId))
      )
    );
    const users = await User.find({ _id: { $in: otherUserIds } });
    const userMap = new Map(users.map((u) => [u._id, u]));

    const result = conversations.map((c) => {
      const otherId = c.participantIds.find((id) => id !== viewerId);
      const otherUser = otherId ? userMap.get(otherId) : null;
      return {
        id: c._id,
        participantIds: c.participantIds,
        lastMessageAt: c.lastMessageAt,
        otherUser: otherUser
          ? {
              id: otherUser._id,
              name: otherUser.name,
              skills: otherUser.skills,
            }
          : null,
      };
    });

    res.json({ conversations: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/conversations/:conversationId/messages
messagingRouter.get("/conversations/:conversationId/messages", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    if (!canAccessConversation(req.user!._id, conversation)) {
      return next(new AppError("You are not a participant in this conversation", 403));
    }

    const before = req.query.before as string;
    const query: any = { conversationId: conversation._id };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(50);
    res.json({ messages });
  } catch (err) {
    next(err);
  }
});

// POST /api/conversations/:conversationId/messages
messagingRouter.post("/conversations/:conversationId/messages", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
      return next(new AppError("Message text is required", 400));
    }

    const conversation = await Conversation.findById(req.params.conversationId);
    if (!conversation) {
      return next(new AppError("Conversation not found", 404));
    }

    if (!canAccessConversation(req.user!._id, conversation)) {
      return next(new AppError("You are not a participant in this conversation", 403));
    }

    const recipientId = conversation.participantIds.find((id) => id !== req.user!._id);
    if (!recipientId) {
      return next(new AppError("Recipient not found in conversation", 400));
    }

    // Non-negotiable rule: Gated by accepted connection and absence of block
    const allowed = await canMessageUser(req.user!._id, recipientId);
    if (!allowed) {
      return next(new AppError("Messaging requires an accepted connection and active relationship", 403));
    }

    const message = new Message({
      _id: `msg-${crypto.randomBytes(6).toString("hex")}`,
      conversationId: conversation._id,
      senderId: req.user!._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await message.save();

    conversation.lastMessageAt = new Date();
    await conversation.save();

    res.status(201).json({ message });
  } catch (err) {
    next(err);
  }
});
