import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import { Post, Comment, PostInteraction, Affiliation } from "../../shared/models.js";
import { canViewPost, canPostToAudience, isInstitutionAdmin } from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";
import { recordTopicSignal } from "../../shared/topic-interests.js";

export const postsRouter = Router();

// GET /api/posts/me - Retrieve current authenticated user's own posts for the profile section
postsRouter.get("/posts/me", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const posts = await Post.find({ authorId: req.user!._id }).sort({ createdAt: -1 });

    const primaryAff = await Affiliation.findOne({ userId: req.user!._id, status: "active" });

    const postIds = posts.map((p) => p._id);
    const commentsCount = await Comment.aggregate([
      { $match: { postId: { $in: postIds } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);
    const likesCount = await PostInteraction.aggregate([
      { $match: { postId: { $in: postIds }, type: "like" } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
    ]);

    const commentCountMap = new Map(commentsCount.map((c) => [c._id, c.count]));
    const likeCountMap = new Map(likesCount.map((l) => [l._id, l.count]));

    const formatted = posts.map((p) => ({
      id: p._id,
      text: p.text,
      media: p.media,
      audienceType: p.audienceType,
      audienceId: p.audienceId,
      institutionId: p.institutionId,
      topicLabels: p.topicLabels,
      createdAt: p.createdAt,
      commentCount: commentCountMap.get(p._id) || 0,
      likeCount: likeCountMap.get(p._id) || 0,
      author: {
        id: req.user!._id,
        name: req.user!.name,
        role: primaryAff?.role || "Member",
        institutionId: primaryAff?.institutionId,
        verificationStatus: primaryAff?.verificationStatus || "unverified",
      },
    }));

    res.json({ posts: formatted });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/posts/:postId
postsRouter.delete("/posts/:postId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const isAuthor = post.authorId === req.user!._id;
    const isInstAdmin = post.institutionId && (await isInstitutionAdmin(req.user!._id, post.institutionId));

    if (!isAuthor && !isInstAdmin) {
      return next(new AppError("You do not have permission to delete this post", 403));
    }

    await Post.findByIdAndDelete(post._id);
    await Comment.deleteMany({ postId: post._id });
    await PostInteraction.deleteMany({ postId: post._id });

    res.json({ message: "Post successfully deleted", postId: post._id });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts
postsRouter.post("/posts", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, media, audienceType = "public", audienceId, institutionId, topicLabels = [] } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return next(new AppError("Post text is required", 400));
    }
    if (!Array.isArray(topicLabels) || topicLabels.some((label: unknown) => typeof label !== "string")) {
      return next(new AppError("Topic labels must be an array of strings", 400));
    }
    const normalizedTopicLabels = [...new Set(
      topicLabels.map((label: string) => label.trim().slice(0, 80)).filter(Boolean)
    )];

    let targetInstId = institutionId;
    if (audienceType === "campus" && !targetInstId) {
      const aff = await Affiliation.findOne({ userId: req.user!._id, status: "active" });
      if (aff) targetInstId = aff.institutionId;
    }

    const isAuthorized = await canPostToAudience(req.user!._id, audienceType, audienceId, targetInstId);
    if (!isAuthorized) {
      return next(new AppError("Not authorized to publish to this audience", 403));
    }

    const post = new Post({
      _id: `post-${crypto.randomBytes(6).toString("hex")}`,
      authorId: req.user!._id,
      text: text.trim(),
      media: media || [],
      audienceType,
      audienceId,
      institutionId: targetInstId,
      topicLabels: normalizedTopicLabels,
      createdAt: new Date(),
    });

    await post.save();
    await Promise.all(
      normalizedTopicLabels.map((topic: string) =>
        recordTopicSignal(req.user!._id, topic, "post", `post:${post._id}`, post.createdAt)
      )
    );
    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:postId
postsRouter.get("/posts/:postId", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const allowed = await canViewPost(req.user!, post);
    if (!allowed) {
      return next(new AppError("You do not have permission to view this post", 403));
    }

    res.json({ post });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:postId/interactions (like/save/hide)
postsRouter.post("/posts/:postId/interactions", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.body as { type: "like" | "save" | "hide" };
    if (!["like", "save", "hide"].includes(type)) {
      return next(new AppError("Invalid interaction type. Must be like, save, or hide", 400));
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const allowed = await canViewPost(req.user!, post);
    if (!allowed) {
      return next(new AppError("Cannot interact with inaccessible post", 403));
    }

    // Idempotent upsert; only a newly created interaction adds an interest signal.
    const interactionResult = await PostInteraction.updateOne(
      { userId: req.user!._id, postId: post._id, type },
      { $setOnInsert: { _id: `act-${crypto.randomBytes(6).toString("hex")}`, createdAt: new Date() } },
      { upsert: true }
    );

    if (interactionResult.upsertedCount > 0) {
      await Promise.all(
        post.topicLabels.map((topic) =>
          recordTopicSignal(
            req.user!._id,
            topic,
            type,
            `interaction:${req.user!._id}:${post._id}:${type}`
          )
        )
      );
    }

    res.json({ message: `Post interaction '${type}' recorded` });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:postId/comments
postsRouter.post("/posts/:postId/comments", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body as { text?: unknown };
    if (typeof text !== "string" || text.trim().length === 0) {
      return next(new AppError("Comment text is required", 400));
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const allowed = await canViewPost(req.user!, post);
    if (!allowed) {
      return next(new AppError("Cannot comment on inaccessible post", 403));
    }

    const comment = new Comment({
      _id: `cmt-${crypto.randomBytes(6).toString("hex")}`,
      postId: post._id,
      authorId: req.user!._id,
      text: text.trim(),
      createdAt: new Date(),
    });

    await comment.save();
    await Promise.all(
      post.topicLabels.map((topic) =>
        recordTopicSignal(req.user!._id, topic, "comment", `comment:${comment._id}`, comment.createdAt)
      )
    );
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:postId/comments
postsRouter.get("/posts/:postId/comments", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return next(new AppError("Post not found", 404));
    }

    const allowed = await canViewPost(req.user!, post);
    if (!allowed) {
      return next(new AppError("Cannot read comments of inaccessible post", 403));
    }

    const comments = await Comment.find({ postId: post._id }).sort({ createdAt: 1 });
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});
