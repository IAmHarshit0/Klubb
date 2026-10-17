import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import { Follow } from "../../shared/models.js";
import { AppError } from "../../shared/errors.js";

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

    res.status(201).json({ follow });
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

    res.json({ message: "Unfollowed successfully" });
  } catch (err) {
    next(err);
  }
});
