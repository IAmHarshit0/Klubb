import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import { Follow } from "../../shared/models.js";
import { AppError } from "../../shared/errors.js";
import { recordTopicFollow } from "../../shared/topic-interests.js";

export const followsRouter = Router();

// POST /api/follows
followsRouter.post("/follows", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetType, targetId } = req.body;
    if (!["user", "topic"].includes(targetType) || !targetId) {
      return next(new AppError("targetType (user|topic) and targetId are required", 400));
    }

    const follow = await Follow.findOneAndUpdate(
      { followerId: req.user!._id, targetType, targetId },
      { $setOnInsert: { _id: `fol-${crypto.randomBytes(6).toString("hex")}`, createdAt: new Date() } },
      { upsert: true, new: true }
    );

    if (targetType === "topic") {
      await recordTopicFollow(req.user!._id, targetId, true, follow.createdAt);
    }

    res.status(201).json({ follow });
  } catch (err) {
    next(err);
  }
});

// GET /api/follows
followsRouter.get("/follows", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const follows = await Follow.find({ followerId: req.user!._id });
    res.json({ follows });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/follows/user/:userId
followsRouter.delete("/follows/user/:userId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const follow = await Follow.findOneAndDelete({
      followerId: req.user!._id,
      targetType: "user",
      targetId: req.params.userId,
    });
    res.json({ message: "Unfollowed user successfully", follow });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/follows/topic/:topicId
followsRouter.delete("/follows/topic/:topicId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const follow = await Follow.findOneAndDelete({
      followerId: req.user!._id,
      targetType: "topic",
      targetId: req.params.topicId,
    });
    if (follow) {
      await recordTopicFollow(req.user!._id, follow.targetId, false);
    }
    res.json({ message: "Unfollowed topic successfully", follow });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/follows/:followId
followsRouter.delete("/follows/:followId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const follow = await Follow.findOneAndDelete({
      _id: req.params.followId,
      followerId: req.user!._id,
    });
    if (!follow) return next(new AppError("Follow relationship not found", 404));
    if (follow.targetType === "topic") {
      await recordTopicFollow(req.user!._id, follow.targetId, false);
    }

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/follow
followsRouter.post("/users/:userId/follow", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = req.params.userId;
    const follow = await Follow.findOneAndUpdate(
      { followerId: req.user!._id, targetType: "user", targetId },
      { $setOnInsert: { _id: `fol-${crypto.randomBytes(6).toString("hex")}`, createdAt: new Date() } },
      { upsert: true, new: true }
    );
    res.status(201).json({ follow, message: "User followed successfully" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:userId/follow
followsRouter.delete("/users/:userId/follow", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = req.params.userId;
    await Follow.findOneAndDelete({ followerId: req.user!._id, targetType: "user", targetId });
    res.json({ message: "User unfollowed successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/topics/:topicId/follow
followsRouter.post("/topics/:topicId/follow", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = decodeURIComponent(req.params.topicId as string);
    const follow = await Follow.findOneAndUpdate(
      { followerId: req.user!._id, targetType: "topic", targetId },
      { $setOnInsert: { _id: `fol-${crypto.randomBytes(6).toString("hex")}`, createdAt: new Date() } },
      { upsert: true, new: true }
    );
    await recordTopicFollow(req.user!._id, targetId, true, follow.createdAt);
    res.status(201).json({ follow, message: "Topic followed successfully" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/topics/:topicId/follow
followsRouter.delete("/topics/:topicId/follow", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetId = decodeURIComponent(req.params.topicId as string);
    const follow = await Follow.findOneAndDelete({ followerId: req.user!._id, targetType: "topic", targetId });
    if (follow) {
      await recordTopicFollow(req.user!._id, targetId, false);
    }
    res.json({ message: "Topic unfollowed successfully" });
  } catch (err) {
    next(err);
  }
});

