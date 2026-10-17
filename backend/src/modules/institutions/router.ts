import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser, optionalAuth } from "../auth/middleware.js";
import { Institution, Group, Affiliation } from "../../shared/models.js";
import { AppError } from "../../shared/errors.js";

export const institutionsRouter = Router();

// GET /api/institutions
institutionsRouter.get("/institutions", optionalAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const institutions = await Institution.find();
    res.json({ institutions });
  } catch (err) {
    next(err);
  }
});

// GET /api/institutions/:id/tree
institutionsRouter.get("/institutions/:id/tree", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inst = await Institution.findById(req.params.id);
    if (!inst) {
      return next(new AppError("Institution not found", 404));
    }

    const groups = await Group.find({ institutionId: inst._id });

    // Separate groups by type to form the tree
    const departments = groups.filter((g) => g.groupType === "department");
    const programmes = groups.filter((g) => g.groupType === "programme");
    const batches = groups.filter((g) => g.groupType === "batch");
    const clubs = groups.filter((g) => g.groupType === "club");
    const general = groups.filter((g) => g.groupType === "general");

    res.json({
      institution: inst,
      tree: {
        departments,
        programmes,
        batches,
        clubs,
        general,
        allGroups: groups,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/institutions/:id/groups
institutionsRouter.post("/institutions/:id/groups", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institutionId = req.params.id;
    const { name, groupType = "general", visibility = "campus_only", parentGroupId, postingPolicy = "all_members" } = req.body;

    if (!name) {
      return next(new AppError("Group name is required", 400));
    }

    const inst = await Institution.findById(institutionId);
    if (!inst) {
      return next(new AppError("Institution not found", 404));
    }

    const group = new Group({
      _id: `grp-${crypto.randomBytes(6).toString("hex")}`,
      institutionId,
      parentGroupId,
      name,
      groupType,
      visibility,
      postingPolicy,
      createdBy: req.user!._id,
    });

    await group.save();
    res.status(201).json({ group });
  } catch (err) {
    next(err);
  }
});

// POST /api/institutions/:id/affiliations/:affiliationId/verification
institutionsRouter.post(
  "/institutions/:id/affiliations/:affiliationId/verification",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: institutionId, affiliationId } = req.params;
      const { status } = req.body; // "institution-verified" or "unverified"

      if (!["institution-verified", "unverified"].includes(status)) {
        return next(new AppError("Invalid verification status", 400));
      }

      const affiliation = await Affiliation.findOne({ _id: affiliationId, institutionId });
      if (!affiliation) {
        return next(new AppError("Affiliation not found for this institution", 404));
      }

      affiliation.verificationStatus = status;
      if (status === "institution-verified") {
        affiliation.verifiedAt = new Date();
      }
      await affiliation.save();

      // Write audit event
      const { AuditEvent } = await import("../../shared/models.js");
      const audit = new AuditEvent({
        _id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        actorId: req.user!._id,
        action: "affiliation_verification_update",
        targetType: "affiliation",
        targetId: affiliationId,
        scopeId: institutionId,
        metadata: { newStatus: status },
      });
      await audit.save();

      res.json({ message: "Affiliation verification updated", affiliation });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/institutions/:id/announcements
institutionsRouter.post(
  "/institutions/:id/announcements",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id;
      const { title, body, targetType = "institution", targetIds = [] } = req.body;

      if (!title || !body) {
        return next(new AppError("Title and body are required for announcements", 400));
      }

      const { InstitutionAnnouncement } = await import("../../shared/models.js");
      const announcement = new InstitutionAnnouncement({
        _id: `ann-${crypto.randomBytes(6).toString("hex")}`,
        institutionId,
        senderId: req.user!._id,
        targetType,
        targetIds,
        title,
        body,
        status: "published",
        createdAt: new Date(),
      });
      await announcement.save();

      res.status(201).json({ announcement });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/me/announcements
institutionsRouter.get("/me/announcements", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const userAffs = await Affiliation.find({ userId: user._id, status: "active" });
    const instIds = userAffs.map((a) => a.institutionId);

    const { InstitutionAnnouncement } = await import("../../shared/models.js");
    const announcements = await InstitutionAnnouncement.find({
      $or: [
        { institutionId: { $in: instIds }, targetType: "institution" },
        { targetType: "individual", targetIds: user._id },
      ],
      status: "published",
    }).sort({ createdAt: -1 });

    res.json({ announcements });
  } catch (err) {
    next(err);
  }
});

// POST /api/institutions/:id/roles
institutionsRouter.post(
  "/institutions/:id/roles",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id;
      const { name, permissions = [], scopeType = "institution", scopeId } = req.body;

      if (!name) return next(new AppError("Role name is required", 400));

      const { RoleDefinition } = await import("../../shared/models.js");
      const roleDef = new RoleDefinition({
        _id: `role-${crypto.randomBytes(6).toString("hex")}`,
        institutionId,
        scopeType,
        scopeId: scopeId || institutionId,
        name,
        permissions,
        createdBy: req.user!._id,
      });
      await roleDef.save();

      res.status(201).json({ roleDefinition: roleDef });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/institutions/:id/role-assignments
institutionsRouter.post(
  "/institutions/:id/role-assignments",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id;
      const { userId, roleDefinitionId, scopeType = "institution", scopeId } = req.body;

      if (!userId || !roleDefinitionId) {
        return next(new AppError("userId and roleDefinitionId are required", 400));
      }

      const { RoleAssignment } = await import("../../shared/models.js");
      const assignment = new RoleAssignment({
        _id: `rass-${crypto.randomBytes(6).toString("hex")}`,
        userId,
        roleDefinitionId,
        scopeType,
        scopeId: scopeId || institutionId,
        assignedBy: req.user!._id,
        status: "active",
        createdAt: new Date(),
      });
      await assignment.save();

      res.status(201).json({ roleAssignment: assignment });
    } catch (err) {
      next(err);
    }
  }
);

