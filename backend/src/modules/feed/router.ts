import { Router, Request, Response, NextFunction } from "express";
import { authenticateUser } from "../auth/middleware.js";
import {
  Post,
  User,
  Affiliation,
  Follow,
  PostInteraction,
  UserFeedPreferences,
} from "../../shared/models.js";
import { canViewPost } from "../../shared/permissions.js";
import {
  computeBaselineScore,
  computeRerankedScore,
  applyDiversityFilter,
  rerankWithFlashRank,
  ScoredPost,
} from "./ranking.js";
import { config } from "../../config/index.js";
import { getUserTopicMap, normalizeTopic } from "../../shared/topic-interests.js";

export const feedRouter = Router();

feedRouter.get("/feed", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const viewer = req.user!;
    const tab = (req.query.tab as string) || "for-you";
    const mode = (req.query.mode as string) || "reranked";
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const cursor = req.query.cursor as string;
    const q = (req.query.q as string)?.trim().toLowerCase();

    // 1. Fetch user follows and preferences
    const follows = await Follow.find({ followerId: viewer._id });
    const followedUserIds = new Set(
      follows.filter((f) => f.targetType === "user").map((f) => f.targetId)
    );
    const followedTopicLabels = new Set(
      follows.filter((f) => f.targetType === "topic").map((f) => normalizeTopic(f.targetId))
    );

    // Muted authors and topics
    const prefs = await UserFeedPreferences.findOne({ userId: viewer._id });
    const mutedAuthors = new Set(prefs?.mutedAuthorIds || []);
    const mutedTopics = new Set((prefs?.mutedTopicIds || []).map(normalizeTopic));
    const { topicMap } = await getUserTopicMap(
      viewer,
      new Date(),
      follows,
      prefs?.mutedTopicIds || []
    );
    const topicScores = new Map(topicMap.map((entry) => [entry.topic, entry.score]));

    // Hidden posts
    const hiddenInteractions = await PostInteraction.find({
      userId: viewer._id,
      type: "hide",
    });
    const hiddenPostIds = new Set(hiddenInteractions.map((h) => h.postId));

    // 2. Candidate retrieval query
    const postQuery: any = {};
    if (cursor) {
      postQuery.createdAt = { $lt: new Date(cursor) };
    }

    const candidatePool = await Post.find(postQuery)
      .sort({ createdAt: -1 })
      .limit(100);

    // 3. Pre-ranking permission and mute/hide filter
    const eligiblePosts = [];
    for (const post of candidatePool) {
      // Exclude user's own posts from discovery feed (users retrieve their posts in Profile)
      if (post.authorId === viewer._id) continue;

      if (hiddenPostIds.has(post._id)) continue;
      if (mutedAuthors.has(post.authorId)) continue;

      // 1. Mute by topic labels: do not include if any label is muted
      if (post.topicLabels.some((tl) => mutedTopics.has(normalizeTopic(tl)))) continue;

      // 2. Mute by body text: do not include if post text contains any muted word/phrase
      const postTextLower = post.text.toLowerCase();
      const containsMutedWord = Array.from(mutedTopics).some((muted) => {
        if (!muted || muted.trim().length === 0) return false;
        const escaped = muted.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, "i");
        return regex.test(postTextLower);
      });
      if (containsMutedWord) continue;

      // Optional keyword query filter
      if (q) {
        const matchesQ =
          postTextLower.includes(q) ||
          post.topicLabels.some((tl) => tl.toLowerCase().includes(q));
        if (!matchesQ) continue;
      }

      const isViewable = await canViewPost(viewer, post);
      if (!isViewable) continue;

      eligiblePosts.push(post);
    }

    // 4. Tab-specific eligibility filtering
    const tabFilteredPosts = [];
    const authorAffiliationCache: Record<string, any[]> = {};

    for (const post of eligiblePosts) {
      if (!authorAffiliationCache[post.authorId]) {
        authorAffiliationCache[post.authorId] = await Affiliation.find({
          userId: post.authorId,
          status: "active",
        });
      }
      const affs = authorAffiliationCache[post.authorId];

      if (tab === "alumni") {
        const isAlum = affs.some((a) => a.role === "Alumnus");
        if (!isAlum) continue;
      } else if (tab === "students") {
        const isStudent = affs.some((a) => a.role === "Student");
        if (!isStudent) continue;
      } else if (tab === "following") {
        const matchesAuthor = followedUserIds.has(post.authorId);
        const matchesTopic = post.topicLabels.some((l) =>
          followedTopicLabels.has(normalizeTopic(l))
        );
        if (!matchesAuthor && !matchesTopic) continue;
      }

      tabFilteredPosts.push(post);
    }

    // 5. Scoring & Ranking
    let scored: ScoredPost[] = tabFilteredPosts.map((post) => {
      const affs = authorAffiliationCache[post.authorId] || [];
      const isFollowedAuthor = followedUserIds.has(post.authorId);
      const isFollowedTopic = post.topicLabels.some((l) =>
        followedTopicLabels.has(normalizeTopic(l))
      );

      const dynamicScoreResult = computeBaselineScore(
        post,
        viewer,
        affs,
        isFollowedAuthor,
        isFollowedTopic,
        topicScores
      );

      return {
        post,
        score: dynamicScoreResult.score,
        explanation: dynamicScoreResult.explanation,
      };
    });

    if (mode === "reranked") {
      // Cross-encoder reranking via FlashRank with fallback
      scored = await rerankWithFlashRank(
        scored,
        viewer,
        config.flashrankServiceUrl,
        config.flashrankTimeoutMs
      );
    }

    if (mode === "baseline" && tab === "following") {
      // Deterministic chronological order for following stream
      scored.sort((a, b) => new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime());
    } else {
      scored.sort((a, b) => b.score - a.score);
    }

    // 6. Diversity filter
    const diversified = applyDiversityFilter(scored);

    // 7. Pagination
    const pageItems = diversified.slice(0, limit);
    const nextCursor =
      pageItems.length > 0
        ? pageItems[pageItems.length - 1].post.createdAt.toISOString()
        : null;

    // Attach author summaries
    const authors = await User.find({
      _id: { $in: pageItems.map((p) => p.post.authorId) },
    });
    const authorMap = new Map(authors.map((u) => [u._id, u]));

    const responseItems = pageItems.map((item, index) => {
      const author = authorMap.get(item.post.authorId);
      const primaryAff = authorAffiliationCache[item.post.authorId]?.[0];

      return {
        rank: index + 1,
        score: item.score,
        explanation: item.explanation,
        post: {
          id: item.post._id,
          text: item.post.text,
          media: item.post.media,
          audienceType: item.post.audienceType,
          audienceId: item.post.audienceId,
          topicLabels: item.post.topicLabels,
          createdAt: item.post.createdAt,
          author: {
            id: author?._id || item.post.authorId,
            name: author?.name || "Unknown",
            role: primaryAff?.role || "Member",
            institutionId: primaryAff?.institutionId,
            verificationStatus: primaryAff?.verificationStatus || "unverified",
          },
        },
      };
    });

    res.json({
      tab,
      mode,
      totalCandidates: candidatePool.length,
      eligibleCandidates: tabFilteredPosts.length,
      returnedCount: responseItems.length,
      nextCursor,
      items: responseItems,
    });
  } catch (err) {
    next(err);
  }
});
