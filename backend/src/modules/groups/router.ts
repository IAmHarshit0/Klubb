import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import {
  Group,
  Membership,
  GroupAccessRequest,
  Post,
} from "../../shared/models.js";
import { canModerateGroup } from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";

export const groupsRouter = Router();

// GET /api/groups/:groupId
groupsRouter.get("/groups/:groupId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return next(new AppError("Group not found", 404));

    const memberCount = await Membership.countDocuments({
      groupId: group._id,
      status: "active",
    });

    const isMember = await Membership.findOne({
      userId: req.user!._id,
      groupId: group._id,
      status: "active",
    });

    res.json({
      group,
      memberCount,
      membership: isMember || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/access-requests
groupsRouter.post("/groups/:groupId/access-requests", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId;
    const requesterId = req.user!._id;

    const group = await Group.findById(groupId);
    if (!group) return next(new AppError("Group not found", 404));

    // Check if already active member
    const existingMember = await Membership.findOne({
      userId: requesterId,
      groupId,
      status: "active",
    });
    if (existingMember) {
      return next(new AppError("Already an active member of this group", 400));
    }

    // Check pending request
    const existingReq = await GroupAccessRequest.findOne({
      requesterId,
      groupId,
      status: "pending",
    });
    if (existingReq) {
      return next(new AppError("An access request is already pending", 400));
    }

    const request = new GroupAccessRequest({
      _id: `gar-${crypto.randomBytes(6).toString("hex")}`,
      requesterId,
      groupId,
      status: "pending",
      createdAt: new Date(),
    });

    await request.save();
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/group-access-requests/:requestId
groupsRouter.patch("/group-access-requests/:requestId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!["approved", "declined"].includes(status)) {
      return next(new AppError("Status must be approved or declined", 400));
    }

    const request = await GroupAccessRequest.findById(req.params.requestId);
    if (!request) return next(new AppError("Access request not found", 404));

    // Permission check: Caller must be supervisor/moderator/admin of this group
    const isSupervisor = await canModerateGroup(req.user!._id, request.groupId);
    if (!isSupervisor) {
      return next(new AppError("Only authorized supervisors can review access requests", 403));
    }

    if (request.status !== "pending") {
      return next(new AppError(`Request already ${request.status}`, 400));
    }

    request.status = status;
    request.reviewedBy = req.user!._id;
    request.reviewedAt = new Date();
    await request.save();

    if (status === "approved") {
      await Membership.findOneAndUpdate(
        { userId: request.requesterId, groupId: request.groupId },
        {
          $setOnInsert: { _id: `mem-${crypto.randomBytes(6).toString("hex")}` },
          $set: { status: "active", role: "member", joinedAt: new Date() },
        },
        { upsert: true }
      );
    }

    res.json({ request });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/posts
groupsRouter.post("/groups/:groupId/posts", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId;
    const { text, media = [], topicLabels = [] } = req.body;

    if (!text || text.trim().length === 0) {
      return next(new AppError("Post text is required", 400));
    }

    const group = await Group.findById(groupId);
    if (!group) return next(new AppError("Group not found", 404));

    const membership = await Membership.findOne({
      userId: req.user!._id,
      groupId,
      status: "active",
    });
    if (!membership) {
      return next(new AppError("You must be an active member to post to this group", 403));
    }

    if (group.postingPolicy === "moderators_only" && !["moderator", "supervisor", "admin"].includes(membership.role)) {
      return next(new AppError("Only group moderators can post to this group", 403));
    }

    const post = new Post({
      _id: `post-${crypto.randomBytes(6).toString("hex")}`,
      authorId: req.user!._id,
      text: text.trim(),
      media,
      audienceType: "group",
      audienceId: groupId,
      institutionId: group.institutionId,
      topicLabels,
      createdAt: new Date(),
    });

    await post.save();
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/groups/:groupId
groupsRouter.patch("/groups/:groupId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId as string;
    const isSupervisor = await canModerateGroup(req.user!._id, groupId);
    if (!isSupervisor) {
      return next(new AppError("Only authorized supervisors can edit group settings", 403));
    }

    const group = await Group.findById(groupId);
    if (!group) return next(new AppError("Group not found", 404));

    const { name, visibility, postingPolicy } = req.body;
    if (name) group.name = name;
    if (visibility) group.visibility = visibility;
    if (postingPolicy) group.postingPolicy = postingPolicy;

    await group.save();
    res.json({ group });
  } catch (err) {
    next(err);
  }
});
