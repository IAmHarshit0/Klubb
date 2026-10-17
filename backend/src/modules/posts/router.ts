import { Router, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { authenticateUser } from "../auth/middleware.js";
import { Post, Comment, PostInteraction } from "../../shared/models.js";
import { canViewPost, canPostToAudience } from "../../shared/permissions.js";
import { AppError } from "../../shared/errors.js";

export const postsRouter = Router();

// POST /api/posts
postsRouter.post("/posts", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text, media, audienceType = "public", audienceId, institutionId, topicLabels = [] } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return next(new AppError("Post text is required", 400));
    }

    const isAuthorized = await canPostToAudience(req.user!._id, audienceType, audienceId, institutionId);
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
      institutionId,
      topicLabels,
      createdAt: new Date(),
    });

    await post.save();
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
    const { type } = req.body;
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

    // Idempotent upsert
    await PostInteraction.findOneAndUpdate(
      { userId: req.user!._id, postId: post._id, type },
      { $setOnInsert: { _id: `act-${crypto.randomBytes(6).toString("hex")}`, createdAt: new Date() } },
      { upsert: true }
    );

    res.json({ message: `Post interaction '${type}' recorded` });
  } catch (err) {
    next(err);
  }
});

// POST /api/posts/:postId/comments
postsRouter.post("/posts/:postId/comments", authenticateUser, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { text } = req.body;
    if (!text || text.trim().length === 0) {
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
