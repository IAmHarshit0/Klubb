import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import {
  User,
  Affiliation,
  EmploymentClaim,
  Block,
  Organisation,
  UserConnectionPreferences,
} from "../../shared/models.js";
import { AppError } from "../../shared/errors.js";

export const discoveryRouter = Router();

// GET /api/discover/people
discoveryRouter.get("/discover/people", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewer = req.user!;
    const { q, company, role, skill, institution, programme, batch } = req.query as Record<string, string>;

    // Find all users blocked by or blocking viewer
    const blocks = await Block.find({
      $or: [{ blockerId: viewer._id }, { blockedId: viewer._id }],
    });
    const blockedUserIds = new Set(
      blocks.map((b) => (b.blockerId === viewer._id ? b.blockedId : b.blockerId))
    );
    blockedUserIds.add(viewer._id); // Exclude self

    // Filter by employment claim (company)
    let candidateUserIds: Set<string> | null = null;

    if (company) {
      const claims = await EmploymentClaim.find({
        companyName: { $regex: company, $options: "i" },
      });
      const ids = new Set(claims.map((c) => c.userId));
      candidateUserIds = candidateUserIds ? new Set([...candidateUserIds].filter((x) => ids.has(x))) : ids;
    }

    // Filter by affiliations (role, institution, programme, batch)
    if (role || institution || programme || batch) {
      const affQuery: any = { status: "active" };
      if (role) affQuery.role = { $regex: role, $options: "i" };
      if (institution) affQuery.institutionId = institution;
      if (programme) affQuery.programme = { $regex: programme, $options: "i" };
      if (batch) affQuery.batch = { $regex: batch, $options: "i" };

      const affs = await Affiliation.find(affQuery);
      const ids = new Set(affs.map((a) => a.userId));
      candidateUserIds = candidateUserIds ? new Set([...candidateUserIds].filter((x) => ids.has(x))) : ids;
    }

    // Main user query
    const userQuery: any = {
      _id: { $nin: Array.from(blockedUserIds) },
    };

    if (candidateUserIds) {
      userQuery._id.$in = Array.from(candidateUserIds);
    }

    if (q) {
      userQuery.$or = [
        { name: { $regex: q, $options: "i" } },
        { bio: { $regex: q, $options: "i" } },
        { skills: { $regex: q, $options: "i" } },
      ];
    }

    if (skill) {
      userQuery.skills = { $regex: skill, $options: "i" };
    }

    const matchedUsers = await User.find(userQuery).limit(50);

    // Fetch affiliations, employment claims, and preferences for results
    const userIds = matchedUsers.map((u) => u._id);
    const [affiliations, employmentClaims, connectionPrefs] = await Promise.all([
      Affiliation.find({ userId: { $in: userIds }, status: "active" }),
      EmploymentClaim.find({ userId: { $in: userIds } }),
      UserConnectionPreferences.find({ userId: { $in: userIds } }),
    ]);

    const affMap = new Map<string, any[]>();
    for (const aff of affiliations) {
      if (!affMap.has(aff.userId)) affMap.set(aff.userId, []);
      affMap.get(aff.userId)!.push(aff);
    }

    const claimMap = new Map<string, any[]>();
    for (const cl of employmentClaims) {
      if (!claimMap.has(cl.userId)) claimMap.set(cl.userId, []);
      claimMap.get(cl.userId)!.push(cl);
    }

    const prefMap = new Map(connectionPrefs.map((p) => [p.userId, p]));

    const results = matchedUsers.map((u) => {
      const userAffs = affMap.get(u._id) || [];
      const userClaims = claimMap.get(u._id) || [];
      const prefs = prefMap.get(u._id);

      return {
        id: u._id,
        name: u.name,
        bio: u.bio,
        skills: u.skills,
        affiliations: userAffs.map((a) => ({
          institutionId: a.institutionId,
          role: a.role,
          programme: a.programme,
          batch: a.batch,
          verificationStatus: a.verificationStatus,
        })),
        employmentClaims: userClaims.map((c) => ({
          companyName: c.companyName,
          jobTitle: c.jobTitle,
          status: c.status,
        })),
        availability: prefs
          ? {
              mentorship: prefs.availableForMentorship,
              referrals: prefs.availableForReferrals,
              questions: prefs.availableForQuestions,
              paused: prefs.pauseIncomingRequests,
            }
          : { mentorship: true, referrals: true, questions: true, paused: false },
      };
    });

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/organisations
discoveryRouter.get("/discover/organisations", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    const query: any = {};
    if (q) {
      query.name = { $regex: q, $options: "i" };
    }
    const organisations = await Organisation.find(query).limit(30);
    res.json({ organisations });
  } catch (err) {
    next(err);
  }
});

// POST /api/organisations
discoveryRouter.post("/organisations", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, type, website } = req.body;
    if (!name) return next(new AppError("Organisation name is required", 400));

    const org = new Organisation({
      _id: `org-${crypto.randomBytes(6).toString("hex")}`,
      name,
      type: type || "company",
      website,
      verificationStatus: "unverified",
    });

    await org.save();
    res.status(201).json({ organisation: org });
  } catch (err) {
    next(err);
  }
});

// POST /api/organisations/:id/representatives
discoveryRouter.post("/organisations/:id/representatives", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organisationId = req.params.id;
    const { role = "representative" } = req.body;

    const org = await Organisation.findById(organisationId);
    if (!org) return next(new AppError("Organisation not found", 404));

    const { OrganisationRepresentative } = await import("../../shared/models.js");
    const rep = new OrganisationRepresentative({
      _id: `rep-${crypto.randomBytes(6).toString("hex")}`,
      organisationId,
      userId: req.user!._id,
      role,
      verificationStatus: "pending",
    });

    await rep.save();
    res.status(201).json({ representative: rep });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/organisations/:id/verification
discoveryRouter.patch("/organisations/:id/verification", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organisationId = req.params.id;
    const { verificationStatus } = req.body;

    if (!["verified", "pending", "unverified"].includes(verificationStatus)) {
      return next(new AppError("Invalid verification status", 400));
    }

    const org = await Organisation.findById(organisationId);
    if (!org) return next(new AppError("Organisation not found", 404));

    org.verificationStatus = verificationStatus;
    await org.save();

    res.json({ organisation: org });
  } catch (err) {
    next(err);
  }
});

