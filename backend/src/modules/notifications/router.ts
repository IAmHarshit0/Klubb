import { Router, Request, Response, NextFunction } from "express";
import { authenticateUser } from "../auth/middleware.js";
import { Notification } from "../../shared/models.js";
import { AppError } from "../../shared/errors.js";

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get("/notifications", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!._id;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 30));

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/notifications/:notificationId
notificationsRouter.patch(
  "/notifications/:notificationId",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { notificationId } = req.params;
      const { read = true } = req.body;

      const notification = await Notification.findOne({
        _id: notificationId,
        userId: req.user!._id,
      });

      if (!notification) {
        return next(new AppError("Notification not found", 404));
      }

      notification.read = Boolean(read);
      await notification.save();

      res.json({ notification });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/notifications/read-all
notificationsRouter.post(
  "/notifications/read-all",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Notification.updateMany({ userId: req.user!._id, read: false }, { $set: { read: true } });
      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      next(err);
    }
  }
);
