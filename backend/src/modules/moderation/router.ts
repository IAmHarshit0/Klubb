import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import { Report } from "../../shared/models.js";
import { AppError } from "../../shared/errors.js";

export const moderationRouter = Router();

// POST /api/reports
moderationRouter.post("/reports", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetType, targetId, reason } = req.body;
    if (!targetType || !targetId || !reason) {
      return next(new AppError("targetType, targetId, and reason are required", 400));
    }

    const report = new Report({
      _id: `rep-${crypto.randomBytes(6).toString("hex")}`,
      reporterId: req.user!._id,
      targetType,
      targetId,
      reason,
      status: "pending",
      createdAt: new Date(),
    });

    await report.save();
    res.status(201).json({ report });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports
moderationRouter.get("/reports", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const status = req.query.status as string;
    const query: any = {};
    if (status) query.status = status;

    const reports = await Report.find(query).sort({ createdAt: -1 });
    res.json({ reports });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/reports/:id
moderationRouter.patch("/reports/:id", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, escalatedTo } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return next(new AppError("Report not found", 404));

    if (status) report.status = status;
    if (escalatedTo) report.escalatedTo = escalatedTo;

    await report.save();
    res.json({ report });
  } catch (err) {
    next(err);
  }
});
