import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import {
  OrganizationRegistration,
  AffiliationRequest,
  Institution,
  Organisation,
  Affiliation,
  Group,
  GroupAccessRequest,
  AuditEvent,
  User,
} from "../../shared/models.js";
import {
  isPlatformVerifier,
  isInstitutionAdmin,
  hasInstitutionPermission,
  createNotification,
} from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";

export const verificationRouter = Router();

// ============================================================================
// 1. Organization Registration & Platform Verifier Routes
// ============================================================================

// POST /api/organization-registrations
// Any organization/institution representative can submit an onboarding request
verificationRouter.post(
  "/organization-registrations",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        type = "university",
        website,
        country,
        officialEmail,
        domain,
        description,
        evidence,
        representativeName,
        representativeContact,
      } = req.body;

      if (!name || typeof name !== "string" || !name.trim()) {
        return next(new AppError("Organization name is required", 400));
      }
      if (!officialEmail || typeof officialEmail !== "string" || !officialEmail.includes("@")) {
        return next(new AppError("Valid official contact email is required", 400));
      }
      if (!representativeName || typeof representativeName !== "string" || !representativeName.trim()) {
        return next(new AppError("Authorized representative name is required", 400));
      }

      // Check if similar pending or approved registration exists
      const existing = await OrganizationRegistration.findOne({
        name: { $regex: `^${name.trim()}$`, $options: "i" },
        status: { $in: ["pending", "under_review", "approved"] },
      });
      if (existing) {
        return next(new AppError("A registration request for this organization already exists", 409));
      }

      const reg = new OrganizationRegistration({
        _id: `orgreg-${crypto.randomBytes(6).toString("hex")}`,
        name: name.trim(),
        type,
        website: website?.trim(),
        country: country?.trim(),
        officialEmail: officialEmail.trim(),
        domain: domain?.trim() || officialEmail.split("@")[1],
        description: description?.trim(),
        evidence: evidence?.trim(),
        representativeName: representativeName.trim(),
        representativeContact: representativeContact?.trim() || req.user!._id,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await reg.save();

      // Audit event
      const audit = new AuditEvent({
        _id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        actorId: req.user!._id,
        action: "organization_registration_submitted",
        targetType: "organization_registration",
        targetId: reg._id,
        metadata: { name: reg.name, type: reg.type, email: reg.officialEmail },
      });
      await audit.save();

      res.status(201).json({
        message: "Organization registration submitted successfully. It is now queued for Platform Verifier review.",
        registration: reg,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/organization-registrations
// Campus Network platform verifiers view the verification queue
verificationRouter.get(
  "/admin/organization-registrations",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isVerifier = await isPlatformVerifier(req.user!._id);
      if (!isVerifier) {
        return next(new AppError("Only authorized Campus Network Platform Verifiers can access this queue", 403));
      }

      const { status, type, q } = req.query as Record<string, string>;
      const query: any = {};
      if (status) query.status = status;
      if (type) query.type = type;
      if (q) {
        query.$or = [
          { name: { $regex: q, $options: "i" } },
          { domain: { $regex: q, $options: "i" } },
          { representativeName: { $regex: q, $options: "i" } },
        ];
      }

      const registrations = await OrganizationRegistration.find(query).sort({ createdAt: -1 });
      res.json({ registrations });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/admin/organization-registrations/:id
verificationRouter.get(
  "/admin/organization-registrations/:id",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isVerifier = await isPlatformVerifier(req.user!._id);
      if (!isVerifier) {
        return next(new AppError("Only authorized Campus Network Platform Verifiers can view this registration", 403));
      }

      const registration = await OrganizationRegistration.findById(req.params.id);
      if (!registration) {
        return next(new AppError("Registration request not found", 404));
      }

      res.json({ registration });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/organization-registrations/:id
// Verifier action: approve, reject, more_info_required, suspend, revoke
verificationRouter.patch(
  "/admin/organization-registrations/:id",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isVerifier = await isPlatformVerifier(req.user!._id);
      if (!isVerifier) {
        return next(new AppError("Only authorized Campus Network Platform Verifiers can review registrations", 403));
      }

      const { status, reviewReason, assignedIdentifier } = req.body;
      const validStatuses = ["pending", "under_review", "more_info_required", "approved", "rejected", "suspended", "revoked"];
      if (!validStatuses.includes(status)) {
        return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400));
      }

      const reg = await OrganizationRegistration.findById(req.params.id);
      if (!reg) {
        return next(new AppError("Registration request not found", 404));
      }

      reg.status = status;
      reg.reviewedBy = req.user!._id;
      if (reviewReason) reg.reviewReason = reviewReason;
      if (assignedIdentifier) reg.assignedIdentifier = assignedIdentifier.toUpperCase().trim();
      reg.updatedAt = new Date();
      await reg.save();

      // If approved, create or update Institution or Organisation with verified status
      let createdEntity = null;
      if (status === "approved") {
        const slug = reg.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        if (reg.type === "university" || reg.type === "college" || reg.type === "institution") {
          let inst = await Institution.findOne({ slug });
          if (!inst) {
            inst = new Institution({
              _id: `inst-${assignedIdentifier ? assignedIdentifier.toLowerCase() : crypto.randomBytes(4).toString("hex")}`,
              name: reg.name,
              displayName: reg.name,
              slug,
              type: reg.type,
            });
            await inst.save();
          }
          createdEntity = inst;
        } else {
          let org = await Organisation.findOne({ name: reg.name });
          if (!org) {
            org = new Organisation({
              _id: `org-${assignedIdentifier ? assignedIdentifier.toLowerCase() : crypto.randomBytes(4).toString("hex")}`,
              name: reg.name,
              type: reg.type,
              website: reg.website,
              verificationStatus: "verified",
            });
            await org.save();
          } else {
            org.verificationStatus = "verified";
            await org.save();
          }
          createdEntity = org;
        }
      }

      // Audit event
      const audit = new AuditEvent({
        _id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        actorId: req.user!._id,
        action: `organization_registration_${status}`,
        targetType: "organization_registration",
        targetId: reg._id,
        metadata: {
          decision: status,
          reason: reviewReason,
          assignedIdentifier: reg.assignedIdentifier,
          entityId: createdEntity?._id,
        },
      });
      await audit.save();

      res.json({
        message: `Organization registration marked as ${status}`,
        registration: reg,
        createdEntity,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/organizations/:id/appoint-super-admin
// Platform Verifier appoints the founding Super Admin
verificationRouter.post(
  "/admin/organizations/:id/appoint-super-admin",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isVerifier = await isPlatformVerifier(req.user!._id);
      if (!isVerifier) {
        return next(new AppError("Only Platform Verifiers can appoint the initial Super Admin", 403));
      }

      const orgId = req.params.id;
      const { userId, roleTitle = "Super Admin" } = req.body;

      if (!userId) {
        return next(new AppError("Target userId is required for appointing Super Admin", 400));
      }

      const user = await User.findById(userId);
      if (!user) {
        return next(new AppError("Target user not found", 404));
      }

      // Check if institution or organisation exists
      const inst = await Institution.findById(orgId);
      const org = await Organisation.findById(orgId);
      if (!inst && !org) {
        return next(new AppError("Institution or Organization not found", 404));
      }

      const entityName = inst?.name || org?.name || "Institution";

      // Create or update affiliation with verified Admin status
      const aff = await Affiliation.findOneAndUpdate(
        { userId, institutionId: orgId },
        {
          $setOnInsert: { _id: `aff-admin-${crypto.randomBytes(4).toString("hex")}` },
          $set: {
            role: "Admin",
            status: "active",
            verificationStatus: "institution-verified",
            verifiedAt: new Date(),
            source: "platform_verifier_appointment",
          },
        },
        { upsert: true, new: true }
      );

      // In-app notification to the appointed user
      await createNotification({
        userId,
        actorId: req.user!._id,
        actorName: "Campus Network Platform Verifier",
        type: "role_assigned",
        title: "Appointed Founding Super Admin",
        message: `You have been officially appointed as the Super Admin for ${entityName} by the Campus Network Verifier.`,
        link: `/communities`,
      });

      // Audit event
      const audit = new AuditEvent({
        _id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        actorId: req.user!._id,
        action: "founding_super_admin_appointed",
        targetType: "institution",
        targetId: orgId,
        metadata: { appointedUserId: userId, roleTitle, entityName },
      });
      await audit.save();

      res.status(201).json({
        message: `User ${user.name} appointed as Super Admin for ${entityName}`,
        affiliation: aff,
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/admin/organizations/:id/verification
verificationRouter.patch(
  "/admin/organizations/:id/verification",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isVerifier = await isPlatformVerifier(req.user!._id);
      if (!isVerifier) {
        return next(new AppError("Only Platform Verifiers can alter organization verification status", 403));
      }

      const { verificationStatus } = req.body;
      if (!["verified", "pending", "unverified", "suspended"].includes(verificationStatus)) {
        return next(new AppError("Invalid verification status", 400));
      }

      const orgId = req.params.id;
      const org = await Organisation.findById(orgId);
      if (org) {
        org.verificationStatus = verificationStatus === "suspended" ? "unverified" : verificationStatus;
        await org.save();
        return res.json({ organisation: org });
      }

      const inst = await Institution.findById(orgId);
      if (!inst) {
        return next(new AppError("Organization or Institution not found", 404));
      }

      res.json({ institution: inst, verificationStatus });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 2. Affiliation Verification Request Queue (Institution Super Admin & Officers)
// ============================================================================

// POST /api/affiliation-requests
// An individual submits a request to associate their profile with a verified institution
verificationRouter.post(
  "/affiliation-requests",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        institutionId,
        role = "Student",
        programme,
        department,
        batch,
        officialEmail,
        evidence,
      } = req.body;

      if (!institutionId) {
        return next(new AppError("Institution ID is required", 400));
      }
      if (!["Student", "Alumnus", "Faculty", "Staff", "Researcher"].includes(role)) {
        return next(new AppError("Invalid requested affiliation role", 400));
      }

      const inst = await Institution.findById(institutionId);
      if (!inst) {
        return next(new AppError("Institution not found", 404));
      }

      // Check if user already has an active verified affiliation for this institution
      const existingAff = await Affiliation.findOne({
        userId: req.user!._id,
        institutionId,
        verificationStatus: "institution-verified",
        status: "active",
      });
      if (existingAff) {
        return next(new AppError("You already have an active verified affiliation with this institution", 400));
      }

      // Check if pending request exists
      const pendingReq = await AffiliationRequest.findOne({
        userId: req.user!._id,
        institutionId,
        status: "pending",
      });
      if (pendingReq) {
        return next(new AppError("An affiliation verification request is already pending review", 409));
      }

      const request = new AffiliationRequest({
        _id: `affreq-${crypto.randomBytes(6).toString("hex")}`,
        userId: req.user!._id,
        institutionId,
        role,
        programme: programme?.trim(),
        department: department?.trim(),
        batch: batch?.trim(),
        officialEmail: officialEmail?.trim(),
        evidence: evidence?.trim(),
        status: "pending",
        createdAt: new Date(),
      });
      await request.save();

      // Notify institution admins/verification officers
      const admins = await Affiliation.find({
        institutionId,
        role: "Admin",
        status: "active",
      });
      for (const admin of admins) {
        await createNotification({
          userId: admin.userId,
          actorId: req.user!._id,
          actorName: req.user!.name,
          type: "affiliation_verified",
          title: "New Affiliation Request",
          message: `${req.user!.name} requested verification as ${role} for ${inst.name}.`,
          link: `/communities`,
        });
      }

      res.status(201).json({
        message: "Affiliation verification request submitted successfully",
        request,
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/me/affiliation-requests
verificationRouter.get(
  "/me/affiliation-requests",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requests = await AffiliationRequest.find({ userId: req.user!._id }).sort({ createdAt: -1 });
      const instIds = [...new Set(requests.map((r) => r.institutionId))];
      const institutions = await Institution.find({ _id: { $in: instIds } });
      const instMap = new Map(institutions.map((i) => [i._id, i.name]));

      const populated = requests.map((r) => ({
        ...r.toObject(),
        institutionName: instMap.get(r.institutionId) || r.institutionId,
      }));

      res.json({ requests: populated });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/institutions/:id/verification-requests
// GET /api/organizations/:id/verification-requests
const getVerificationRequestsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institutionId = req.params.id as string;
    const canReview =
      (await isInstitutionAdmin(req.user!._id, institutionId)) ||
      (await hasInstitutionPermission(req.user!._id, institutionId, "verify_affiliation"));

    if (!canReview) {
      return next(new AppError("You do not have permission to view affiliation verification requests for this institution", 403));
    }

    const requests = await AffiliationRequest.find({ institutionId }).sort({ createdAt: -1 });
    const userIds = [...new Set(requests.map((r) => r.userId))];
    const users = await User.find({ _id: { $in: userIds } });
    const userMap = new Map(users.map((u) => [u._id, u]));

    const populated = requests.map((r) => {
      const user = userMap.get(r.userId);
      return {
        ...r.toObject(),
        userName: user?.name || "Unknown User",
        userEmail: user?.email || "",
      };
    });

    res.json({ requests: populated });
  } catch (err) {
    next(err);
  }
};

verificationRouter.get("/institutions/:id/verification-requests", authenticateUser, getVerificationRequestsHandler);
verificationRouter.get("/organizations/:id/verification-requests", authenticateUser, getVerificationRequestsHandler);

// PATCH /api/affiliation-requests/:id
// Institution verification officer approves or declines request
verificationRouter.patch(
  "/affiliation-requests/:id",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const request = await AffiliationRequest.findById(req.params.id);
      if (!request) {
        return next(new AppError("Affiliation request not found", 404));
      }

      const canReview =
        (await isInstitutionAdmin(req.user!._id, request.institutionId)) ||
        (await hasInstitutionPermission(req.user!._id, request.institutionId, "verify_affiliation"));

      if (!canReview) {
        return next(new AppError("You do not have permission to verify affiliations for this institution", 403));
      }

      const { status, reviewReason } = req.body;
      if (!["approved", "rejected", "more_info_required"].includes(status)) {
        return next(new AppError("Status must be approved, rejected, or more_info_required", 400));
      }

      request.status = status;
      request.reviewedBy = req.user!._id;
      if (reviewReason) request.reviewReason = reviewReason;
      request.reviewedAt = new Date();
      await request.save();

      const inst = await Institution.findById(request.institutionId);
      const instName = inst?.name || "Institution";

      if (status === "approved") {
        // Create or update user's Affiliation
        await Affiliation.findOneAndUpdate(
          { userId: request.userId, institutionId: request.institutionId },
          {
            $setOnInsert: { _id: `aff-${crypto.randomBytes(6).toString("hex")}` },
            $set: {
              role: request.role,
              programme: request.programme,
              department: request.department,
              batch: request.batch,
              status: "active",
              verificationStatus: "institution-verified",
              verifiedAt: new Date(),
              source: `request_${request._id}`,
            },
          },
          { upsert: true }
        );

        // Notify user
        await createNotification({
          userId: request.userId,
          actorId: req.user!._id,
          actorName: req.user!.name,
          type: "affiliation_verified",
          title: "Affiliation Approved!",
          message: `Your affiliation as ${request.role} with ${instName} has been verified.`,
          link: `/profile/me`,
        });
      } else if (status === "rejected") {
        await createNotification({
          userId: request.userId,
          actorId: req.user!._id,
          actorName: req.user!.name,
          type: "affiliation_rejected",
          title: "Affiliation Request Declined",
          message: `Your affiliation request for ${instName} was declined${reviewReason ? `: "${reviewReason}"` : "."}`,
          link: `/profile/me`,
        });
      }

      // Audit event
      const audit = new AuditEvent({
        _id: `aud-${crypto.randomBytes(6).toString("hex")}`,
        actorId: req.user!._id,
        action: `affiliation_request_${status}`,
        targetType: "affiliation_request",
        targetId: request._id,
        scopeId: request.institutionId,
        metadata: {
          applicantId: request.userId,
          role: request.role,
          decision: status,
          reason: reviewReason,
        },
      });
      await audit.save();

      res.json({
        message: `Affiliation request ${status}`,
        request,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ============================================================================
// 3. Institution Community Metrics (Section 6)
// ============================================================================

// GET /api/institutions/:id/metrics
// GET /api/organizations/:id/metrics
const getInstitutionMetricsHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const institutionId = req.params.id;
    const inst = await Institution.findById(institutionId);
    if (!inst) {
      return next(new AppError("Institution not found", 404));
    }

    const [
      pendingAffiliationRequests,
      activeAffiliations,
      activeGroups,
      pendingAccessRequests,
    ] = await Promise.all([
      AffiliationRequest.countDocuments({ institutionId, status: "pending" }),
      Affiliation.find({ institutionId, status: "active", verificationStatus: "institution-verified" }),
      Group.find({ institutionId }),
      GroupAccessRequest.find({ status: "pending" }),
    ]);

    // Distinct counts per user
    const studentUserIds = new Set<string>();
    const alumniUserIds = new Set<string>();
    const facultyUserIds = new Set<string>();
    const otherUserIds = new Set<string>();

    for (const a of activeAffiliations) {
      if (a.role === "Student") studentUserIds.add(a.userId);
      else if (a.role === "Alumnus") alumniUserIds.add(a.userId);
      else if (a.role === "Faculty" || a.role === "Staff") facultyUserIds.add(a.userId);
      else otherUserIds.add(a.userId);
    }

    const groupIds = new Set(activeGroups.map((g) => g._id));
    const pendingGroupAccessCount = pendingAccessRequests.filter((r) => groupIds.has(r.groupId)).length;

    res.json({
      institutionId,
      institutionName: inst.name,
      metrics: {
        pendingAffiliationRequests,
        verifiedStudents: studentUserIds.size,
        verifiedAlumni: alumniUserIds.size,
        verifiedFacultyStaff: facultyUserIds.size,
        otherVerifiedMembers: otherUserIds.size,
        totalVerifiedPeople: new Set(activeAffiliations.map((a) => a.userId)).size,
        activeGroups: activeGroups.length,
        pendingGroupAccessRequests: pendingGroupAccessCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

verificationRouter.get("/institutions/:id/metrics", authenticateUser, getInstitutionMetricsHandler);
verificationRouter.get("/organizations/:id/metrics", authenticateUser, getInstitutionMetricsHandler);
