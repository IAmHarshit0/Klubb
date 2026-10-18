import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser, requireVerifiedAlumnus } from "../auth/middleware.js";
import {
  User,
  Affiliation,
  EmploymentClaim,
  Block,
  Organisation,
  UserConnectionPreferences,
  Institution,
  Group,
  Post,
  Membership,
} from "../../shared/models.js";
import { AppError } from "../../shared/errors.js";
import { normalizeTopic, recordTopicSignal } from "../../shared/topic-interests.js";
import { hasInstitutionPermission, canViewPost } from "../../shared/permissions.js";

export const discoveryRouter = Router();

/**
 * Ranks alumni and professional profiles based on user needs:
 * - When seeking referrals: priority to availableForReferrals, non-paused, employer-verified at target company.
 * - When seeking mentorship: priority to availableForMentorship, non-paused, shared academic background.
 * - Institutional affinity: bonus for fellow alma mater peers.
 * - Skills & Topic synergy: bonus for overlapping skills with the viewer.
 */
export function computeAlumniNeedsScore(
  user: any,
  viewer: any,
  viewerAffiliations: any[],
  userAffiliations: any[],
  employmentClaims: any[],
  connectionPrefs: any,
  intent?: string,
  targetCompany?: string
): { score: number; reasons: string[] } {
  let score = 50;
  const reasons: string[] = [];

  const isPaused = Boolean(connectionPrefs?.pauseIncomingRequests);
  const isReferralReady = connectionPrefs ? Boolean(connectionPrefs.availableForReferrals && !isPaused) : !isPaused;
  const isMentorshipReady = connectionPrefs ? Boolean(connectionPrefs.availableForMentorship && !isPaused) : !isPaused;
  const isQuestionsReady = connectionPrefs ? Boolean(connectionPrefs.availableForQuestions && !isPaused) : !isPaused;

  const normalizedIntent = intent?.toLowerCase().trim() || "all";

  // 1. Availability Gates & Needs Targeting
  if (isPaused) {
    score -= 40;
    reasons.push("Incoming requests paused");
  } else if (normalizedIntent === "referral") {
    if (isReferralReady) {
      score += 40;
      reasons.push("Available for job referrals");
    } else {
      score -= 30;
      reasons.push("Not accepting referral requests");
    }
  } else if (normalizedIntent === "mentorship") {
    if (isMentorshipReady) {
      score += 40;
      reasons.push("Available for mentorship");
    } else {
      score -= 30;
      reasons.push("Not accepting mentorship requests");
    }
  } else if (normalizedIntent === "questions") {
    if (isQuestionsReady) {
      score += 40;
      reasons.push("Open to questions");
    } else {
      score -= 30;
    }
  } else {
    // General exploration
    if (isReferralReady && isMentorshipReady) {
      score += 25;
      reasons.push("Open to referrals & mentorship");
    } else if (isReferralReady) {
      score += 20;
      reasons.push("Open to referrals");
    } else if (isMentorshipReady) {
      score += 15;
      reasons.push("Open to mentorship");
    }
  }

  // 2. Employer Verification Trust (crucial for genuine ATS internal referrals!)
  const verifiedClaims = employmentClaims.filter(
    (c: any) => c.status === "verified" || c.status === "employer-verified"
  );
  if (verifiedClaims.length > 0) {
    score += 20;
    reasons.push("Employer-verified professional");
  }

  // 3. Target Company Alignment
  if (targetCompany) {
    const targetLower = targetCompany.toLowerCase();
    const hasTargetVerified = verifiedClaims.some((c: any) =>
      c.companyName?.toLowerCase().includes(targetLower)
    );
    const hasTargetClaim = employmentClaims.some((c: any) =>
      c.companyName?.toLowerCase().includes(targetLower)
    );

    if (hasTargetVerified) {
      score += 25;
      reasons.push(`Verified employee at ${targetCompany}`);
    } else if (hasTargetClaim) {
      score += 10;
      reasons.push(`Works at ${targetCompany}`);
    }
  }

  // 4. Institutional Alma Mater Affinity
  const viewerInstIds = new Set(viewerAffiliations.map((a: any) => a.institutionId));
  const viewerDepts = new Set(
    viewerAffiliations.map((a: any) => a.department?.toLowerCase()).filter(Boolean)
  );
  const viewerProgrammes = new Set(
    viewerAffiliations.map((a: any) => a.programme?.toLowerCase()).filter(Boolean)
  );

  const sharedInstitution = userAffiliations.some((a: any) => viewerInstIds.has(a.institutionId));
  const sharedDept = userAffiliations.some(
    (a: any) => a.department && viewerDepts.has(a.department.toLowerCase())
  );
  const sharedProg = userAffiliations.some(
    (a: any) => a.programme && viewerProgrammes.has(a.programme.toLowerCase())
  );

  if (sharedInstitution) {
    score += 15;
    reasons.push("Fellow alma mater peer");
  }
  if (sharedDept || sharedProg) {
    score += 10;
    reasons.push("Shared department / programme");
  }

  // 5. Skill & Domain Topic Synergy
  const viewerSkills = new Set((viewer?.skills || []).map((s: string) => s.toLowerCase()));
  const viewerInterests = new Set((viewer?.interests || []).map((i: string) => i.toLowerCase()));
  const candidateSkills = (user?.skills || []).map((s: string) => s.toLowerCase());

  const matchingSkills = candidateSkills.filter(
    (s: string) => viewerSkills.has(s) || viewerInterests.has(s)
  );
  if (matchingSkills.length > 0) {
    const boost = Math.min(15, matchingSkills.length * 5);
    score += boost;
    reasons.push(`Matching skills (${matchingSkills.slice(0, 2).join(", ")})`);
  }

  const normalizedScore = Math.max(1, Math.min(100, Math.round(score)));
  return { score: normalizedScore, reasons };
}

// GET /api/discover/people
discoveryRouter.get("/discover/people", authenticateUser, requireVerifiedAlumnus, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewer = req.user!;
    const { q, company, role, skill, institution, programme, batch, intent } = req.query as Record<string, string>;

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

    // Fetch affiliations, employment claims, preferences, and viewer affiliations
    const userIds = matchedUsers.map((u) => u._id);
    const [affiliations, employmentClaims, connectionPrefs, viewerAffs] = await Promise.all([
      Affiliation.find({ userId: { $in: userIds }, status: "active" }),
      EmploymentClaim.find({ userId: { $in: userIds } }),
      UserConnectionPreferences.find({ userId: { $in: userIds } }),
      Affiliation.find({ userId: viewer._id, status: "active" }),
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

    const nonStudentUserIds = new Set(
      affiliations
        .filter((a) => a.role !== "Student")
        .map((a) => a.userId)
    );
    for (const u of matchedUsers) {
      const uAffs = affMap.get(u._id) || [];
      const uClaims = claimMap.get(u._id) || [];
      if (uAffs.length === 0 && uClaims.length > 0) {
        nonStudentUserIds.add(u._id);
      }
    }

    const prefMap = new Map(connectionPrefs.map((p) => [p.userId, p]));

    const results = matchedUsers.map((u) => {
      const userAffs = affMap.get(u._id) || [];
      const userClaims = claimMap.get(u._id) || [];
      const prefs = prefMap.get(u._id);

      const targetNeed = (intent as string) || (q?.toLowerCase().includes("referral") ? "referral" : q?.toLowerCase().includes("mentor") ? "mentorship" : undefined);
      const targetCo = company || (q && !targetNeed ? q : undefined);
      const { score, reasons } = computeAlumniNeedsScore(
        u,
        viewer,
        viewerAffs,
        userAffs,
        userClaims,
        prefs,
        targetNeed,
        targetCo
      );

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
        ...(nonStudentUserIds.has(u._id) && {
          availability: prefs
            ? {
                mentorship: prefs.availableForMentorship,
                referrals: prefs.availableForReferrals,
                questions: prefs.availableForQuestions,
                paused: prefs.pauseIncomingRequests,
              }
            : { mentorship: true, referrals: true, questions: true, paused: false },
        }),
        relevanceScore: score,
        rankingReasons: reasons,
      };
    });

    // Sort by relevanceScore descending so alumni are ranked based on user needs
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const searchTopics = [...new Set([q, skill, role, programme]
      .filter((topic): topic is string => Boolean(topic?.trim() && topic.trim().length >= 3))
      .map(normalizeTopic)
      .filter(Boolean))];
    const searchDay = new Date().toISOString().slice(0, 10);
    await Promise.all(
      searchTopics.map((topic) =>
        recordTopicSignal(viewer._id, topic, "search", `search:${topic}:${searchDay}`)
      )
    );

    res.json({ results });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/alumni (and alias /api/alumni)
// Accessible to students and all verified campus members to discover the alumni network ranked based on needs (referrals, mentorship, advice)
const alumniDiscoveryHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewer = req.user!;
    const { q, company, skill, institution, programme, batch, intent = "referral" } = req.query as Record<string, string>;

    // Find all users blocked by or blocking viewer
    const blocks = await Block.find({
      $or: [{ blockerId: viewer._id }, { blockedId: viewer._id }],
    });
    const blockedUserIds = new Set(
      blocks.map((b) => (b.blockerId === viewer._id ? b.blockedId : b.blockerId))
    );
    blockedUserIds.add(viewer._id); // Exclude self

    // Find all alumni with active affiliations
    const alumniAffQuery: any = { role: "Alumnus", status: "active" };
    if (institution) alumniAffQuery.institutionId = institution;
    if (programme) alumniAffQuery.programme = { $regex: programme, $options: "i" };
    if (batch) alumniAffQuery.batch = { $regex: batch, $options: "i" };

    const alumniAffs = await Affiliation.find(alumniAffQuery);
    let alumniUserIds = new Set(alumniAffs.map((a) => a.userId).filter((id) => !blockedUserIds.has(id)));

    // Filter by company employment claim if specified
    if (company) {
      const claims = await EmploymentClaim.find({
        userId: { $in: Array.from(alumniUserIds) },
        companyName: { $regex: company, $options: "i" },
      });
      const claimUserIds = new Set(claims.map((c) => c.userId));
      alumniUserIds = new Set([...alumniUserIds].filter((id) => claimUserIds.has(id)));
    }

    const userQuery: any = {
      _id: { $in: Array.from(alumniUserIds) },
    };

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
    const userIds = matchedUsers.map((u) => u._id);

    const [affiliations, employmentClaims, connectionPrefs, viewerAffs] = await Promise.all([
      Affiliation.find({ userId: { $in: userIds }, status: "active" }),
      EmploymentClaim.find({ userId: { $in: userIds } }),
      UserConnectionPreferences.find({ userId: { $in: userIds } }),
      Affiliation.find({ userId: viewer._id, status: "active" }),
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
      const uAffs = affMap.get(u._id) || [];
      const uClaims = claimMap.get(u._id) || [];
      const prefs = prefMap.get(u._id);

      const { score, reasons } = computeAlumniNeedsScore(
        u,
        viewer,
        viewerAffs,
        uAffs,
        uClaims,
        prefs,
        intent,
        company || (q && !intent ? q : undefined)
      );

      return {
        id: u._id,
        name: u.name,
        bio: u.bio,
        skills: u.skills,
        affiliations: uAffs.map((a) => ({
          institutionId: a.institutionId,
          role: a.role,
          programme: a.programme,
          batch: a.batch,
          verificationStatus: a.verificationStatus,
        })),
        employmentClaims: uClaims.map((c) => ({
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
        relevanceScore: score,
        rankingReasons: reasons,
      };
    });

    // Rank alumni by relevanceScore descending based on student needs
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({ results, intent, total: results.length });
  } catch (err) {
    next(err);
  }
};

discoveryRouter.get("/discover/alumni", authenticateUser, alumniDiscoveryHandler);
discoveryRouter.get("/alumni", authenticateUser, alumniDiscoveryHandler);

// GET /api/discover/organisations
discoveryRouter.get("/discover/organisations", authenticateUser, requireVerifiedAlumnus, async (req: Request, res: Response, next: NextFunction) => {
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

    const verifierAffiliations = await Affiliation.find({
      userId: req.user!._id,
      status: "active",
      verificationStatus: "institution-verified",
    });
    const verificationPermissions = await Promise.all(
      verifierAffiliations.map((affiliation) =>
        hasInstitutionPermission(req.user!._id, affiliation.institutionId, "verify_employment")
      )
    );
    const canVerify = verificationPermissions.some(Boolean);
    if (!canVerify) {
      return next(new AppError("Only assigned employment verifiers can verify organisations", 403));
    }

    org.verificationStatus = verificationStatus;
    await org.save();

    res.json({ organisation: org });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/organizations (alias for organisations)
discoveryRouter.get("/discover/organizations", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    const query: any = {};
    if (q) {
      query.name = { $regex: q, $options: "i" };
    }
    const organisations = await Organisation.find(query).limit(50);
    res.json({ organisations, organizations: organisations });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/institutions
discoveryRouter.get("/discover/institutions", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    const query: any = {};
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { displayName: { $regex: q, $options: "i" } },
        { slug: { $regex: q, $options: "i" } },
      ];
    }

    const institutions = await Institution.find(query).limit(50);
    const instIds = institutions.map((i) => i._id);

    // Get verified member and group counts
    const [affiliations, groups] = await Promise.all([
      Affiliation.find({ institutionId: { $in: instIds }, status: "active", verificationStatus: "institution-verified" }),
      Group.find({ institutionId: { $in: instIds } }),
    ]);

    const memberCountMap = new Map<string, number>();
    for (const a of affiliations) {
      memberCountMap.set(a.institutionId, (memberCountMap.get(a.institutionId) || 0) + 1);
    }

    const groupCountMap = new Map<string, number>();
    for (const g of groups) {
      groupCountMap.set(g.institutionId, (groupCountMap.get(g.institutionId) || 0) + 1);
    }

    const results = institutions.map((inst) => ({
      _id: inst._id,
      name: inst.name,
      displayName: inst.displayName,
      slug: inst.slug,
      type: inst.type,
      verifiedMemberCount: memberCountMap.get(inst._id) || 0,
      groupCount: groupCountMap.get(inst._id) || 0,
    }));

    res.json({ institutions: results });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/groups
discoveryRouter.get("/discover/groups", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, institutionId, groupType } = req.query as Record<string, string>;
    const query: any = { visibility: { $ne: "restricted" } };

    if (q) {
      query.name = { $regex: q, $options: "i" };
    }
    if (institutionId) {
      query.institutionId = institutionId;
    }
    if (groupType) {
      query.groupType = groupType;
    }

    const groups = await Group.find(query).limit(50);
    const groupIds = groups.map((g) => g._id);

    const memberships = await Membership.find({ groupId: { $in: groupIds }, status: "active" });
    const countMap = new Map<string, number>();
    for (const m of memberships) {
      countMap.set(m.groupId, (countMap.get(m.groupId) || 0) + 1);
    }

    const myMemberships = await Membership.find({
      userId: req.user!._id,
      groupId: { $in: groupIds },
      status: "active",
    });
    const myGroupIds = new Set(myMemberships.map((m) => m.groupId));

    const results = groups.map((g) => ({
      _id: g._id,
      name: g.name,
      groupType: g.groupType,
      visibility: g.visibility,
      institutionId: g.institutionId,
      memberCount: countMap.get(g._id) || 0,
      isMember: myGroupIds.has(g._id),
    }));

    res.json({ groups: results });
  } catch (err) {
    next(err);
  }
});

// GET /api/discover/posts
discoveryRouter.get("/discover/posts", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, topic } = req.query as Record<string, string>;
    const query: any = { audienceType: "public" };

    if (q) {
      query.text = { $regex: q, $options: "i" };
    }
    if (topic) {
      query.topicLabels = { $regex: topic, $options: "i" };
    }

    const posts = await Post.find(query).sort({ createdAt: -1 }).limit(30);
    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const authors = await User.find({ _id: { $in: authorIds } });
    const authorMap = new Map(authors.map((u) => [u._id, u]));

    const formatted = posts.map((p) => {
      const author = authorMap.get(p.authorId);
      return {
        id: p._id,
        text: p.text,
        media: p.media,
        audienceType: p.audienceType,
        topicLabels: p.topicLabels,
        createdAt: p.createdAt,
        author: {
          id: author?._id || p.authorId,
          name: author?.name || "Member",
          role: "Member",
          verificationStatus: "institution-verified",
        },
      };
    });

    res.json({ posts: formatted });
  } catch (err) {
    next(err);
  }
});

