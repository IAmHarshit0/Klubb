import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import {
  Connection,
  Block,
  User,
  Conversation,
  UserConnectionPreferences,
} from "../../shared/models.js";
import { isBlocked } from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";

export const connectionsRouter = Router();

// GET /api/connections
connectionsRouter.get("/connections", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewerId = req.user!._id;
    const status = req.query.status as string;

    const query: any = {
      $or: [{ requesterId: viewerId }, { recipientId: viewerId }],
    };
    if (status) {
      query.status = status;
    }

    const connections = await Connection.find(query).sort({ createdAt: -1 });
    res.json({ connections });
  } catch (err) {
    next(err);
  }
});

// POST /api/connections
connectionsRouter.post("/connections", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requesterId = req.user!._id;
    const { recipientId, message } = req.body;

    if (!recipientId) {
      return next(new AppError("Recipient ID is required", 400));
    }
    if (requesterId === recipientId) {
      return next(new AppError("Cannot connect with yourself", 400));
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return next(new AppError("Recipient not found", 404));
    }

    // Check blocked
    if (await isBlocked(requesterId, recipientId)) {
      return next(new AppError("Cannot connect with this user", 403));
    }

    // Check recipient pauseIncomingRequests
    const prefs = await UserConnectionPreferences.findOne({ userId: recipientId });
    if (prefs?.pauseIncomingRequests) {
      return next(new AppError("This user is currently not accepting new connection requests", 400));
    }

    const [id1, id2] = [requesterId, recipientId].sort();
    const pairKey = `${id1}_${id2}`;

    let conn = await Connection.findOne({ pairKey });
    if (conn) {
      if (conn.status === "pending") {
        return next(new AppError("A connection request is already pending", 400));
      }
      if (conn.status === "accepted") {
        return next(new AppError("Already connected", 400));
      }
      // Re-requesting after decline/cancel
      conn.requesterId = requesterId;
      conn.recipientId = recipientId;
      conn.status = "pending";
      conn.message = message || "";
      conn.updatedAt = new Date();
      await conn.save();
      return res.json({ connection: conn });
    }

    conn = new Connection({
      _id: `conn-${crypto.randomBytes(6).toString("hex")}`,
      pairKey,
      requesterId,
      recipientId,
      status: "pending",
      message: message || "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await conn.save();
    res.status(201).json({ connection: conn });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/connections/:connectionId
connectionsRouter.patch("/connections/:connectionId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!["accepted", "declined"].includes(status)) {
      return next(new AppError("Status must be accepted or declined", 400));
    }

    const conn = await Connection.findById(req.params.connectionId);
    if (!conn) {
      return next(new AppError("Connection request not found", 404));
    }

    // Only the recipient can accept or decline
    if (conn.recipientId !== req.user!._id) {
      return next(new AppError("Only the recipient can respond to this connection request", 403));
    }

    if (conn.status !== "pending") {
      return next(new AppError(`Connection is already ${conn.status}`, 400));
    }

    conn.status = status;
    conn.updatedAt = new Date();
    await conn.save();

    // If accepted, ensure a Conversation document exists for real-time and persistent chat
    if (status === "accepted") {
      const [id1, id2] = [conn.requesterId, conn.recipientId].sort();
      const conversationKey = `${id1}_${id2}`;
      let conv = await Conversation.findOne({ conversationKey });
      if (!conv) {
        conv = new Conversation({
          _id: `conv-${crypto.randomBytes(6).toString("hex")}`,
          conversationKey,
          participantIds: [id1, id2],
          createdAt: new Date(),
          lastMessageAt: new Date(),
        });
        await conv.save();
      }
    }

    res.json({ connection: conn });
  } catch (err) {
    next(err);
  }
});

// POST /api/connections/:connectionId/cancel
connectionsRouter.post("/connections/:connectionId/cancel", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conn = await Connection.findById(req.params.connectionId);
    if (!conn) {
      return next(new AppError("Connection request not found", 404));
    }

    if (conn.requesterId !== req.user!._id) {
      return next(new AppError("Only the requester can cancel this request", 403));
    }

    if (conn.status !== "pending") {
      return next(new AppError(`Cannot cancel a connection that is ${conn.status}`, 400));
    }

    conn.status = "cancelled";
    conn.updatedAt = new Date();
    await conn.save();

    res.json({ message: "Connection request cancelled", connection: conn });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/block
connectionsRouter.post("/users/:userId/block", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const blockerId = req.user!._id;
    const blockedId = req.params.userId;

    if (blockerId === blockedId) {
      return next(new AppError("Cannot block yourself", 400));
    }

    await Block.findOneAndUpdate(
      { blockerId, blockedId },
      { $setOnInsert: { _id: `blk-${crypto.randomBytes(6).toString("hex")}`, createdAt: new Date() } },
      { upsert: true }
    );

    res.json({ message: "User blocked successfully" });
  } catch (err) {
    next(err);
  }
});
