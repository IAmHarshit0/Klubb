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
      const { name, permissions = [], scopeType = "institution", scopeId, description } = req.body;

      if (!name) return next(new AppError("Role name is required", 400));

      // Verify caller has admin/governance permission
      const { hasInstitutionPermission } = await import("../../shared/permissions.js");
      const isAuthorized = await hasInstitutionPermission(req.user!._id, institutionId, "manage_roles");
      if (!isAuthorized) {
        return next(new AppError("Only institution administrators can define roles", 403));
      }

      const { RoleDefinition, AuditEvent } = await import("../../shared/models.js");
      const roleDef = new RoleDefinition({
        _id: `role-${crypto.randomBytes(6).toString("hex")}`,
        institutionId,
        scopeType,
        scopeId: scopeId || institutionId,
        name: name.trim(),
        permissions: permissions.length > 0 ? permissions : ["general_access"],
        createdBy: req.user!._id,
      });
      await roleDef.save();

      // Audit event
      const audit = new AuditEvent({
        _id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        actorId: req.user!._id,
        action: "role_definition_created",
        targetType: "role",
        targetId: roleDef._id,
        scopeId: institutionId,
        metadata: { roleName: roleDef.name, permissions: roleDef.permissions },
      });
      await audit.save();

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

      // Verify caller has admin/governance permission
      const { hasInstitutionPermission } = await import("../../shared/permissions.js");
      const isAuthorized = await hasInstitutionPermission(req.user!._id, institutionId, "assign_roles");
      if (!isAuthorized) {
        return next(new AppError("Only institution administrators can assign roles", 403));
      }

      const { RoleAssignment, RoleDefinition, Affiliation, User, AuditEvent } = await import("../../shared/models.js");

      // Verify role definition exists
      const roleDef = await RoleDefinition.findById(roleDefinitionId);
      if (!roleDef) {
        return next(new AppError("Role definition not found", 404));
      }

      // Verify target user exists
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return next(new AppError("Target user not found", 404));
      }

      // Check if target user has an active affiliation with this institution
      const affiliation = await Affiliation.findOne({
        userId,
        institutionId,
        status: "active",
      });

      // Assignment: default target scope is institution
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

      // Audit event
      const audit = new AuditEvent({
        _id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        actorId: req.user!._id,
        action: "role_assigned_to_user",
        targetType: "role_assignment",
        targetId: assignment._id,
        scopeId: institutionId,
        metadata: {
          assignedTo: userId,
          roleId: roleDefinitionId,
          roleName: roleDef.name,
          userAffiliationRole: affiliation?.role || "User",
          verificationStatus: affiliation?.verificationStatus || "unverified",
        },
      });
      await audit.save();

      res.status(201).json({
        roleAssignment: {
          ...assignment.toObject(),
          roleName: roleDef.name,
          userName: targetUser.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/institutions/:id/roles
institutionsRouter.get(
  "/institutions/:id/roles",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id;
      const { RoleDefinition } = await import("../../shared/models.js");
      const roles = await RoleDefinition.find({ institutionId }).sort({ createdAt: -1 });
      res.json({ roles });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/institutions/:id/role-assignments
institutionsRouter.get(
  "/institutions/:id/role-assignments",
  optionalAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id;
      const { RoleAssignment, RoleDefinition, User, Affiliation } = await import("../../shared/models.js");
      
      const assignments = await RoleAssignment.find({ scopeId: institutionId, status: "active" }).sort({ createdAt: -1 });
      
      // Populate user and role definition info
      const userIds = [...new Set(assignments.map((a) => a.userId))];
      const roleDefIds = [...new Set(assignments.map((a) => a.roleDefinitionId))];
      
      const [users, roleDefs, affiliations] = await Promise.all([
        User.find({ _id: { $in: userIds } }),
        RoleDefinition.find({ _id: { $in: roleDefIds } }),
        Affiliation.find({ userId: { $in: userIds }, institutionId, status: "active" }),
      ]);

      const userMap = new Map(users.map((u) => [u._id, u]));
      const roleDefMap = new Map(roleDefs.map((r) => [r._id, r]));
      const affMap = new Map(affiliations.map((a) => [a.userId, a]));

      const populatedAssignments = assignments.map((a) => {
        const user = userMap.get(a.userId);
        const role = roleDefMap.get(a.roleDefinitionId);
        const aff = affMap.get(a.userId);

        return {
          _id: a._id,
          userId: a.userId,
          userName: user?.name || "Unknown User",
          userRole: aff?.role || "User",
          userDepartment: aff?.department || aff?.programme || "",
          verificationStatus: aff?.verificationStatus || "unverified",
          roleDefinitionId: a.roleDefinitionId,
          roleName: role?.name || "Custom Role",
          permissions: role?.permissions || [],
          assignedBy: a.assignedBy,
          createdAt: a.createdAt,
        };
      });

      res.json({ roleAssignments: populatedAssignments });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/institutions/:id/verified-members
// Returns all verified campus members (alumni, students, faculty, or users) eligible for role assignment
institutionsRouter.get(
  "/institutions/:id/verified-members",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id;
      const { Affiliation, User } = await import("../../shared/models.js");

      const affs = await Affiliation.find({
        institutionId,
        status: "active",
      });

      const userIds = affs.map((a) => a.userId);
      const users = await User.find({ _id: { $in: userIds } });
      const userMap = new Map(users.map((u) => [u._id, u]));

      const members = affs.map((a) => {
        const u = userMap.get(a.userId);
        return {
          userId: a.userId,
          name: u?.name || "Unknown User",
          email: u?.email || "",
          role: a.role || "User",
          programme: a.programme,
          department: a.department,
          batch: a.batch,
          verificationStatus: a.verificationStatus,
        };
      });

      res.json({ members });
    } catch (err) {
      next(err);
    }
  }
);

