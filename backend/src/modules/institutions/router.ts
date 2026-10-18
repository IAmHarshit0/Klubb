import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser, optionalAuth } from "../auth/middleware.js";
import { Institution, Community, Group, Affiliation } from "../../shared/models.js";
import {
  hasDelegatedInstitutionPermission,
  hasInstitutionPermission,
  isInstitutionSuperAdmin,
} from "../../shared/permissions.js";
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
    const communities = await Community.find({ institutionId: inst._id }).sort({ name: 1 });

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
        communities,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/institutions/:id/communities
institutionsRouter.post(
  "/institutions/:id/communities",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id as string;
      const { name, suffix } = req.body;
      if (typeof name !== "string" || !name.trim()) {
        return next(new AppError("Community name is required", 400));
      }
      if (typeof suffix !== "string" || !suffix.trim()) {
        return next(new AppError("A unique community suffix is required", 400));
      }

      const slug = suffix.trim().toLowerCase();
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        return next(
          new AppError("Community suffix must use lowercase letters, numbers, and single hyphens", 400)
        );
      }

      const institution = await Institution.findById(institutionId);
      if (!institution) return next(new AppError("Institution not found", 404));

      if (!(await hasDelegatedInstitutionPermission(req.user!._id, institutionId, "create_community"))) {
        return next(new AppError("Only institution verification officers can create communities", 403));
      }

      if (await Community.exists({ institutionId, slug })) {
        return next(new AppError("That community suffix is already in use at this institution", 409));
      }

      const community = new Community({
        _id: `com-${crypto.randomBytes(6).toString("hex")}`,
        institutionId,
        name: name.trim(),
        slug,
        createdBy: req.user!._id,
      });
      try {
        await community.save();
      } catch (error) {
        if ((error as { code?: number }).code === 11000) {
          return next(new AppError("That community suffix is already in use at this institution", 409));
        }
        throw error;
      }

      res.status(201).json({ community });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/institutions/:id/groups
institutionsRouter.post("/institutions/:id/groups", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institutionId = req.params.id as string;
    const { name, groupType = "general", visibility = "campus_only", parentGroupId, postingPolicy = "all_members" } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return next(new AppError("Group name is required", 400));
    }

    if (!(await isInstitutionSuperAdmin(req.user!._id, institutionId))) {
      return next(new AppError("Only this institution's Super Admin can create groups", 403));
    }

    const inst = await Institution.findById(institutionId);
    if (!inst) {
      return next(new AppError("Institution not found", 404));
    }

    if (!["programme", "batch", "department", "club", "general"].includes(groupType)) {
      return next(new AppError("Invalid group type", 400));
    }
    if (!["public", "campus_only", "restricted"].includes(visibility)) {
      return next(new AppError("Invalid group visibility", 400));
    }
    if (!["all_members", "moderators_only"].includes(postingPolicy)) {
      return next(new AppError("Invalid group posting policy", 400));
    }
    if (parentGroupId) {
      const parent = await Group.findOne({ _id: parentGroupId, institutionId });
      if (!parent) return next(new AppError("Parent group must belong to this institution", 400));
    }

    const group = new Group({
      _id: `grp-${crypto.randomBytes(6).toString("hex")}`,
      institutionId,
      parentGroupId,
      name: name.trim(),
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
      const institutionId = req.params.id as string;
      const affiliationId = req.params.affiliationId as string;
      const { status } = req.body; // "institution-verified" or "unverified"

      if (!["institution-verified", "unverified"].includes(status)) {
        return next(new AppError("Invalid verification status", 400));
      }

      if (!(await hasInstitutionPermission(req.user!._id, institutionId, "verify_affiliation"))) {
        return next(new AppError("You do not have permission to verify affiliations for this institution", 403));
      }

      const affiliation = await Affiliation.findOne({ _id: affiliationId, institutionId });
      if (!affiliation) {
        return next(new AppError("Affiliation not found for this institution", 404));
      }

      affiliation.verificationStatus = status;
      if (status === "institution-verified") {
        affiliation.verifiedAt = new Date();
      } else {
        affiliation.verifiedAt = undefined;
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
      const institutionId = req.params.id as string;
      const { title, body, targetType = "institution", targetIds = [] } = req.body;

      if (!title || !body) {
        return next(new AppError("Title and body are required for announcements", 400));
      }

      if (!(await hasInstitutionPermission(req.user!._id, institutionId, "publish_announcement"))) {
        return next(new AppError("You do not have permission to publish institution announcements", 403));
      }

      if (!["institution", "group", "individual"].includes(targetType)) {
        return next(new AppError("Invalid announcement target type", 400));
      }
      if (!Array.isArray(targetIds) || targetIds.some((id: unknown) => typeof id !== "string")) {
        return next(new AppError("targetIds must be an array of identifiers", 400));
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
      const institutionId = req.params.id as string;
      const { name, permissions = [], scopeType = "institution", scopeId, description } = req.body;

      if (!name) return next(new AppError("Role name is required", 400));

      // Verify caller has admin/governance permission
      if (!(await isInstitutionSuperAdmin(req.user!._id, institutionId))) {
        return next(new AppError("Only institution administrators can define roles", 403));
      }

      if (typeof name !== "string" || !name.trim()) {
        return next(new AppError("Role name is required", 400));
      }
      if (scopeType !== "institution" || (scopeId && scopeId !== institutionId)) {
        return next(new AppError("Institution roles must use this institution as their scope", 400));
      }
      const supportedPermissions = new Set([
        "verify_affiliation",
        "verify_employment",
        "publish_announcement",
        "moderate_student_groups",
        "create_community",
      ]);
      if (!Array.isArray(permissions) || permissions.some((permission: unknown) =>
        typeof permission !== "string" || !supportedPermissions.has(permission)
      )) {
        return next(new AppError("Role contains an unsupported permission", 400));
      }

      const { RoleDefinition, AuditEvent } = await import("../../shared/models.js");
      const roleDef = new RoleDefinition({
        _id: `role-${crypto.randomBytes(6).toString("hex")}`,
        institutionId,
        scopeType,
        scopeId: scopeId || institutionId,
        name: name.trim(),
        permissions,
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
      const institutionId = req.params.id as string;
      const { userId, roleDefinitionId, scopeType = "institution", scopeId } = req.body;

      if (!userId || !roleDefinitionId) {
        return next(new AppError("userId and roleDefinitionId are required", 400));
      }

      // Verify caller has admin/governance permission
      if (!(await isInstitutionSuperAdmin(req.user!._id, institutionId))) {
        return next(new AppError("Only institution administrators can assign roles", 403));
      }

      const { RoleAssignment, RoleDefinition, Affiliation, User, AuditEvent } = await import("../../shared/models.js");

      const roleDef = await RoleDefinition.findOne({
        _id: roleDefinitionId,
        institutionId,
        scopeType: "institution",
        scopeId: institutionId,
      });
      if (!roleDef) {
        return next(new AppError("Role definition not found for this institution", 404));
      }

      // Verify target user exists
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        return next(new AppError("Target user not found", 404));
      }

      // Role holders must have an active, verified affiliation at this institution.
      const affiliation = await Affiliation.findOne({
        userId,
        institutionId,
        status: "active",
        verificationStatus: "institution-verified",
      });
      if (!affiliation) {
        return next(new AppError("Target user must be a verified member of this institution", 400));
      }
      if (scopeType !== "institution" || (scopeId && scopeId !== institutionId)) {
        return next(new AppError("Role assignments must use this institution as their scope", 400));
      }
      if (await RoleAssignment.exists({
        userId,
        roleDefinitionId,
        scopeType: "institution",
        scopeId: institutionId,
        status: "active",
      })) {
        return next(new AppError("This role is already assigned to the target user", 409));
      }

      // Assignment: default target scope is institution
      const assignment = new RoleAssignment({
        _id: `rass-${crypto.randomBytes(6).toString("hex")}`,
        userId,
        roleDefinitionId,
        scopeType: "institution",
        scopeId: institutionId,
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
      const institutionId = req.params.id as string;
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
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const institutionId = req.params.id as string;
      if (!(await isInstitutionSuperAdmin(req.user!._id, institutionId))) {
        return next(new AppError("Only this institution's Super Admin can view role assignments", 403));
      }
      const { RoleAssignment, RoleDefinition, User, Affiliation } = await import("../../shared/models.js");
      
      const assignments = await RoleAssignment.find({
        scopeType: "institution",
        scopeId: institutionId,
        status: "active",
      }).sort({ createdAt: -1 });
      
      // Populate user and role definition info
      const userIds = [...new Set(assignments.map((a) => a.userId))];
      const roleDefIds = [...new Set(assignments.map((a) => a.roleDefinitionId))];
      
      const [users, roleDefs, affiliations] = await Promise.all([
        User.find({ _id: { $in: userIds } }),
        RoleDefinition.find({
          _id: { $in: roleDefIds },
          institutionId,
          scopeType: "institution",
          scopeId: institutionId,
        }),
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
      const institutionId = req.params.id as string;
      if (!(await isInstitutionSuperAdmin(req.user!._id, institutionId))) {
        return next(new AppError("Only this institution's Super Admin can view members for role assignment", 403));
      }
      const { Affiliation, User } = await import("../../shared/models.js");

      const affs = await Affiliation.find({
        institutionId,
        status: "active",
        verificationStatus: "institution-verified",
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
