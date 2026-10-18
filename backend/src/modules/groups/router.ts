import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import {
  Group,
  Membership,
  GroupAccessRequest,
  Post,
  User,
  Affiliation,
  Conversation,
  Message,
} from "../../shared/models.js";
import { canModerateGroup, isInstitutionAdmin } from "../../shared/permissions.js";
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

    const isInstAdmin = await isInstitutionAdmin(req.user!._id, group.institutionId);

    let isMember = await Membership.findOne({
      userId: req.user!._id,
      groupId: group._id,
      status: "active",
    });

    if (isInstAdmin) {
      isMember = {
        ...(isMember ? isMember.toObject() : {}),
        _id: isMember?._id || `admin-perm-${req.user!._id}`,
        userId: req.user!._id,
        groupId: group._id,
        role: "admin",
        status: "active",
        isSuperAdmin: true,
      } as any;
    }

    res.json({
      group,
      memberCount,
      membership: isMember || null,
      isInstitutionAdmin: isInstAdmin,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/groups/:groupId/access-requests
groupsRouter.post("/groups/:groupId/access-requests", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId as string;
    const requesterId = req.user!._id;

    const group = await Group.findById(groupId);
    if (!group) return next(new AppError("Group not found", 404));

    // Check if institution admin (superadmin already has full access)
    const isInstAdmin = await isInstitutionAdmin(requesterId, group.institutionId);
    if (isInstAdmin) {
      return next(new AppError("Superadmins already have full administrative access to this group", 400));
    }

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

    // Send access request notification to the institution's superadmin(s) in Messages
    try {
      const adminAffs = await Affiliation.find({
        institutionId: group.institutionId,
        role: "Admin",
        status: "active",
      });

      const { RoleAssignment, RoleDefinition } = await import("../../shared/models.js");
      const assignments = await RoleAssignment.find({
        status: "active",
        scopeType: "institution",
        scopeId: group.institutionId,
      });

      const adminUserIds = new Set<string>(adminAffs.map((a) => a.userId));

      if (assignments.length > 0) {
        const roleDefIds = assignments.map((a) => a.roleDefinitionId);
        const roles = await RoleDefinition.find({ _id: { $in: roleDefIds } });
        const adminRoleIds = new Set(
          roles
            .filter((r) => r.permissions.includes("*") || r.permissions.includes("admin") || r.permissions.includes("manage_groups"))
            .map((r) => r._id)
        );
        for (const a of assignments) {
          if (adminRoleIds.has(a.roleDefinitionId)) {
            adminUserIds.add(a.userId);
          }
        }
      }

      const requesterName = req.user!.name || "A student";
      const requesterEmail = req.user!.email ? ` (${req.user!.email})` : "";
      const noticeText = `[Group Access Request] ${requesterName}${requesterEmail} requested access to join group "${group.name}". (Request ID: ${request._id})`;

      const now = new Date();
      for (const adminId of adminUserIds) {
        if (adminId === requesterId) continue;

        const [id1, id2] = [requesterId, adminId].sort();
        const conversationKey = `${id1}_${id2}`;

        let conv = await Conversation.findOne({ conversationKey });
        if (!conv) {
          conv = new Conversation({
            _id: `conv-${crypto.randomBytes(6).toString("hex")}`,
            conversationKey,
            participantIds: [id1, id2],
            createdAt: now,
            lastMessageAt: now,
          });
          await conv.save();
        } else {
          conv.lastMessageAt = now;
          await conv.save();
        }

        const msg = new Message({
          _id: `msg-${crypto.randomBytes(6).toString("hex")}`,
          conversationId: conv._id,
          senderId: requesterId,
          text: noticeText,
          createdAt: now,
        });
        await msg.save();
      }
    } catch (notifyErr) {
      console.error("Failed to deliver group access request message to institution superadmin:", notifyErr);
    }

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
    const groupId = req.params.groupId as string;
    const { text, media = [], topicLabels = [] } = req.body;

    if (!text || text.trim().length === 0) {
      return next(new AppError("Post text is required", 400));
    }

    const group = await Group.findById(groupId);
    if (!group) return next(new AppError("Group not found", 404));

    const isInstAdmin = await isInstitutionAdmin(req.user!._id, group.institutionId);
    const membership = await Membership.findOne({
      userId: req.user!._id,
      groupId,
      status: "active",
    });
    if (!membership && !isInstAdmin) {
      return next(new AppError("You must be an active member to post to this group", 403));
    }

    if (
      !isInstAdmin &&
      group.postingPolicy === "moderators_only" &&
      !(await canModerateGroup(req.user!._id, groupId))
    ) {
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

// GET /api/groups/:groupId/posts
groupsRouter.get("/groups/:groupId/posts", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const groupId = req.params.groupId as string;
    const group = await Group.findById(groupId);
    if (!group) return next(new AppError("Group not found", 404));

    if (group.visibility === "restricted") {
      const isInstAdmin = await isInstitutionAdmin(req.user!._id, group.institutionId);
      const membership = await Membership.findOne({
        userId: req.user!._id,
        groupId,
        status: "active",
      });
      if (!membership && !isInstAdmin) {
        return next(new AppError("You must be an active member to view posts in this group", 403));
      }
    }

    const posts = await Post.find({
      audienceType: "group",
      audienceId: groupId,
    }).sort({ createdAt: -1 });

    const authorIds = Array.from(new Set(posts.map((p) => p.authorId)));
    const authors = await User.find({ _id: { $in: authorIds } });
    const authorMap = new Map(authors.map((u) => [u._id, u]));

    const formatted = posts.map((p) => {
      const author = authorMap.get(p.authorId);
      return {
        id: p._id,
        text: p.text,
        media: p.media,
        audienceType: p.audienceType,
        audienceId: p.audienceId,
        institutionId: p.institutionId,
        topicLabels: p.topicLabels,
        createdAt: p.createdAt,
        author: {
          id: author?._id || p.authorId,
          name: author?.name || "Member",
          role: "Member",
          institutionId: p.institutionId,
          verificationStatus: "institution-verified",
        },
      };
    });

    res.json({ posts: formatted });
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
