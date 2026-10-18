import { Router, Request, Response, NextFunction } from "express";
import { authenticateUser, requireVerifiedAlumnus } from "../auth/middleware.js";
import {
  User,
  Affiliation,
  EmploymentClaim,
  UserFeedPreferences,
  UserConnectionPreferences,
} from "../../shared/models.js";
import { canViewProfile, hasVerifiedAlumniAffiliation } from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";

export const usersRouter = Router();

const DEFAULT_CONNECTION_PREFERENCES = {
  availableForMentorship: true,
  availableForReferrals: true,
  availableForQuestions: true,
  pauseIncomingRequests: false,
};

// GET /api/me
usersRouter.get("/me", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const affiliations = await Affiliation.find({ userId: user._id, status: "active" });
    const employmentClaims = await EmploymentClaim.find({ userId: user._id });
    const hasAlumniAccess = await hasVerifiedAlumniAffiliation(user._id);
    const connectionPrefs = hasAlumniAccess
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
        ...(hasAlumniAccess && {
          connectionPreferences: connectionPrefs || DEFAULT_CONNECTION_PREFERENCES,
        }),
      },
    });
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
    const hasAlumniAccess = await hasVerifiedAlumniAffiliation(user._id);
    const connectionPrefs = hasAlumniAccess
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
        ...(hasAlumniAccess && {
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
    const [viewerCanViewAvailability, targetHasAvailability] = await Promise.all([
      hasVerifiedAlumniAffiliation(viewer._id),
      hasVerifiedAlumniAffiliation(user._id),
    ]);
    const connectionPrefs = viewerCanViewAvailability && targetHasAvailability
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
      ...(viewerCanViewAvailability &&
        targetHasAvailability && {
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

// PATCH /api/me/interests
usersRouter.patch("/me/interests", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { interests } = req.body;
    if (!Array.isArray(interests) || interests.some((interest) => typeof interest !== "string")) {
      return next(new AppError("Interests must be an array of strings", 400));
    }

    const normalizedInterests = Array.from(
      new Set(interests.map((interest: string) => interest.trim()).filter(Boolean))
    );
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
    let prefs = await UserFeedPreferences.findOne({ userId: req.user!._id });
    if (!prefs) {
      prefs = new UserFeedPreferences({
        _id: `pref-${req.user!._id}`,
        userId: req.user!._id,
      });
    }

    if (defaultFeedMode) prefs.defaultFeedMode = defaultFeedMode;
    if (mutedTopicIds) prefs.mutedTopicIds = mutedTopicIds;
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
