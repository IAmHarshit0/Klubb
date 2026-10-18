import { Router, Request, Response, NextFunction } from "express";
import { authenticateUser, requireVerifiedAlumnus } from "../auth/middleware.js";
import {
  User,
  Affiliation,
  EmploymentClaim,
  UserFeedPreferences,
  UserConnectionPreferences,
  UserTopicInterest,
  RoleAssignment,
  RoleDefinition,
} from "../../shared/models.js";
import {
  canViewProfile,
  canConfigureAvailability,
  hasVerifiedAlumniAffiliation,
} from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";
import { getUserTopicMap, normalizeTopic, isValidTopicNoun } from "../../shared/topic-interests.js";

export const usersRouter = Router();

const DEFAULT_CONNECTION_PREFERENCES = {
  availableForMentorship: true,
  availableForReferrals: true,
  availableForQuestions: true,
  pauseIncomingRequests: false,
};

async function getInstitutionRoles(userId: string) {
  const [assignments, affiliations] = await Promise.all([
    RoleAssignment.find({
      userId,
      status: "active",
      scopeType: "institution",
    }),
    Affiliation.find({
      userId,
      status: "active",
      verificationStatus: "institution-verified",
    }),
  ]);
  const verifiedInstitutionIds = new Set(affiliations.map((affiliation) => affiliation.institutionId));
  const activeAssignments = assignments.filter((assignment) =>
    verifiedInstitutionIds.has(assignment.scopeId)
  );
  if (activeAssignments.length === 0) return [];

  const roleDefinitions = await RoleDefinition.find({
    _id: { $in: activeAssignments.map((assignment) => assignment.roleDefinitionId) },
    scopeType: "institution",
  });
  const definitionsById = new Map(roleDefinitions.map((role) => [role._id, role]));

  return activeAssignments.flatMap((assignment) => {
    const role = definitionsById.get(assignment.roleDefinitionId);
    if (!role || role.institutionId !== assignment.scopeId || role.scopeId !== assignment.scopeId) {
      return [];
    }
    return [{
      institutionId: assignment.scopeId,
      roleDefinitionId: role._id,
      name: role.name,
      permissions: role.permissions,
    }];
  });
}

// GET /api/me
usersRouter.get("/me", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const affiliations = await Affiliation.find({ userId: user._id, status: "active" });
    const employmentClaims = await EmploymentClaim.find({ userId: user._id });
    const canHaveAvailability = await canConfigureAvailability(user._id);
    const connectionPrefs = canHaveAvailability
      ? await UserConnectionPreferences.findOne({ userId: user._id })
      : null;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        portfolioUrl: user.portfolioUrl,
        skills: user.skills,
        interests: user.interests,
        profileVisibility: user.profileVisibility,
        affiliations,
        employmentClaims,
        institutionRoles: await getInstitutionRoles(user._id),
        ...(canHaveAvailability && {
          connectionPreferences: connectionPrefs || DEFAULT_CONNECTION_PREFERENCES,
        }),
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/me/profile
usersRouter.patch("/me/profile", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, bio, portfolioUrl, skills, interests } = req.body;
    const updateData: any = {};
    if (name && typeof name === "string") updateData.name = name.trim();
    if (bio !== undefined && typeof bio === "string") updateData.bio = bio.trim();
    if (portfolioUrl !== undefined && typeof portfolioUrl === "string") updateData.portfolioUrl = portfolioUrl.trim();
    if (Array.isArray(skills)) updateData.skills = skills.map((s: string) => String(s).trim()).filter(Boolean);
    if (Array.isArray(interests)) {
      updateData.interests = Array.from(
        new Set(
          interests
            .map((i: string) => String(i).trim())
            .filter((i: string) => i.length > 0 && isValidTopicNoun(normalizeTopic(i)))
        )
      ).slice(0, 15);
    }

    const user = await User.findByIdAndUpdate(req.user!._id, { $set: updateData }, { new: true });
    if (!user) return next(new AppError("User not found", 404));

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/me/privacy
usersRouter.patch("/me/privacy", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { profileVisibility } = req.body;
    if (!["public", "campus", "restricted"].includes(profileVisibility)) {
      return next(new AppError("Invalid profileVisibility. Must be public, campus, or restricted", 400));
    }

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { $set: { profileVisibility } },
      { new: true }
    );
    if (!user) return next(new AppError("User not found", 404));

    res.json({ message: "Privacy settings updated successfully", profileVisibility: user.profileVisibility });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:userId/affiliations
usersRouter.get("/users/:userId/affiliations", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const targetUserId = req.params.userId === "me" ? req.user!._id : req.params.userId;
    const affiliations = await Affiliation.find({ userId: targetUserId, status: "active" });
    res.json({ affiliations });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me
usersRouter.get("/users/me", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const affiliations = await Affiliation.find({ userId: user._id, status: "active" });
    const employmentClaims = await EmploymentClaim.find({ userId: user._id });
    const canHaveAvailability = await canConfigureAvailability(user._id);
    const connectionPrefs = canHaveAvailability
      ? await UserConnectionPreferences.findOne({ userId: user._id })
      : null;

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        portfolioUrl: user.portfolioUrl,
        skills: user.skills,
        interests: user.interests,
        profileVisibility: user.profileVisibility,
        affiliations,
        employmentClaims,
        institutionRoles: await getInstitutionRoles(user._id),
        ...(canHaveAvailability && {
          connectionPreferences: connectionPrefs || DEFAULT_CONNECTION_PREFERENCES,
        }),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:userId
usersRouter.get("/users/:userId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewer = req.user!;
    const targetUserId = req.params.userId === "me" ? viewer._id : (req.params.userId as string);

    const allowed = await canViewProfile(viewer._id, targetUserId);
    if (!allowed) {
      return next(new AppError("Profile unavailable or blocked", 404));
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const affiliations = await Affiliation.find({ userId: user._id, status: "active" });
    const employmentClaims = await EmploymentClaim.find({ userId: user._id });
    const targetHasAvailability = await canConfigureAvailability(user._id);
    const viewerCanViewAvailability = await hasVerifiedAlumniAffiliation(viewer._id);
    const connectionPrefs = targetHasAvailability
      ? await UserConnectionPreferences.findOne({ userId: user._id })
      : null;

    res.json({
      id: user._id,
      name: user.name,
      bio: user.bio,
      portfolioUrl: user.portfolioUrl,
      skills: user.skills,
      interests: user.interests,
      profileVisibility: user.profileVisibility,
      affiliations: affiliations.map((a) => ({
        id: a._id,
        institutionId: a.institutionId,
        role: a.role,
        programme: a.programme,
        department: a.department,
        batch: a.batch,
        verificationStatus: a.verificationStatus,
      })),
      employmentClaims: employmentClaims.map((e) => ({
        id: e._id,
        companyName: e.companyName,
        jobTitle: e.jobTitle,
        status: e.status,
      })),
      ...(targetHasAvailability && viewerCanViewAvailability && {
        availability: connectionPrefs
          ? {
              mentorship: connectionPrefs.availableForMentorship,
              referrals: connectionPrefs.availableForReferrals,
              questions: connectionPrefs.availableForQuestions,
              paused: connectionPrefs.pauseIncomingRequests,
            }
          : { mentorship: true, referrals: true, questions: true, paused: false },
      }),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/me/interests
usersRouter.get("/me/interests", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      declaredInterests: req.user!.interests || [],
      skills: req.user!.skills || [],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/me/topic-map
usersRouter.get("/me/topic-map", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await getUserTopicMap(req.user!));
  } catch (err) {
    next(err);
  }
});

// POST /api/me/topic-map/reset
usersRouter.post("/me/topic-map/reset", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await UserTopicInterest.deleteMany({ userId: req.user!._id });
    res.json({ message: "Inferred topic signals reset" });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/me/interests
usersRouter.patch("/me/interests", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interests } = req.body;
    if (!Array.isArray(interests) || interests.some((interest) => typeof interest !== "string")) {
      return next(new AppError("Interests must be an array of strings", 400));
    }

    for (const raw of interests) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (!isValidTopicNoun(normalizeTopic(trimmed))) {
        return next(
          new AppError(
            `"${trimmed}" is not a valid topic noun. Interests must be actual nouns or technical fields (1–3 words) and cannot be filler words.`,
            400
          )
        );
      }
    }

    const normalizedInterests = Array.from(
      new Set(interests.map((interest: string) => interest.trim()).filter(Boolean))
    ).slice(0, 15);

    const user = await User.findByIdAndUpdate(
      req.user!._id,
      { interests: normalizedInterests },
      { new: true }
    );

    if (!user) return next(new AppError("User not found", 404));
    res.json({ message: "Interests updated", interests: user.interests });
  } catch (err) {
    next(err);
  }
});

// POST /api/me/interests/reset
usersRouter.post("/me/interests/reset", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    await User.findByIdAndUpdate(user._id, { interests: [] });
    res.json({ message: "Inferred interests reset successfully", interests: [] });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/me/feed-preferences
usersRouter.patch("/me/feed-preferences", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { defaultFeedMode, mutedTopicIds, mutedAuthorIds } = req.body;
    if (mutedTopicIds !== undefined &&
      (!Array.isArray(mutedTopicIds) || mutedTopicIds.some((topic) => typeof topic !== "string"))) {
      return next(new AppError("Muted topics must be an array of strings", 400));
    }
    let prefs = await UserFeedPreferences.findOne({ userId: req.user!._id });
    if (!prefs) {
      prefs = new UserFeedPreferences({
        _id: `pref-${req.user!._id}`,
        userId: req.user!._id,
      });
    }

    if (defaultFeedMode) prefs.defaultFeedMode = defaultFeedMode;
    if (mutedTopicIds) {
      const normalizedTopics = mutedTopicIds
        .map((topic: string) => normalizeTopic(topic))
        .filter((topic: string) => topic.length > 0);
      prefs.mutedTopicIds = [...new Set<string>(normalizedTopics)];
    }
    if (mutedAuthorIds) prefs.mutedAuthorIds = mutedAuthorIds;
    prefs.updatedAt = new Date();

    await prefs.save();
    res.json({ message: "Feed preferences updated", preferences: prefs });
  } catch (err) {
    next(err);
  }
});

// GET /api/me/connection-preferences
usersRouter.get("/me/connection-preferences", authenticateUser, requireVerifiedAlumnus, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prefs = await UserConnectionPreferences.findOne({ userId: req.user!._id });
    res.json(
      prefs || {
        ...DEFAULT_CONNECTION_PREFERENCES,
      }
    );
  } catch (err) {
    next(err);
  }
});

// PATCH /api/me/connection-preferences
usersRouter.patch("/me/connection-preferences", authenticateUser, requireVerifiedAlumnus, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { availableForMentorship, availableForReferrals, availableForQuestions, pauseIncomingRequests } = req.body;
    let prefs = await UserConnectionPreferences.findOne({ userId: req.user!._id });
    if (!prefs) {
      prefs = new UserConnectionPreferences({
        _id: `cpref-${req.user!._id}`,
        userId: req.user!._id,
      });
    }

    if (availableForMentorship !== undefined) prefs.availableForMentorship = availableForMentorship;
    if (availableForReferrals !== undefined) prefs.availableForReferrals = availableForReferrals;
    if (availableForQuestions !== undefined) prefs.availableForQuestions = availableForQuestions;
    if (pauseIncomingRequests !== undefined) prefs.pauseIncomingRequests = pauseIncomingRequests;

    await prefs.save();
    res.json({ message: "Connection preferences updated", preferences: prefs });
  } catch (err) {
    next(err);
  }
});
