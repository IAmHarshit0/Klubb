import { Request, Response, NextFunction } from "express";
import { User, IUser } from "../../shared/models.js";
import { config } from "../../config/index.js";
import { AppError } from "../../shared/errors.js";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export async function authenticateUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const headerId =
    (req.headers["x-user-id"] as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  const targetId = headerId || config.defaultDemoUserId;

  let user = await User.findById(targetId);
  if (!user && !headerId) {
    // If no header provided and default user not found, pick first available demo user
    user = await User.findOne();
  }

  if (!user) {
    return next(new AppError("User not found or unauthenticated", 401));
  }

  req.user = user;
  next();
}

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const headerId =
    (req.headers["x-user-id"] as string) ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (headerId) {
    const user = await User.findById(headerId);
    if (user) {
      req.user = user;
    }
  }
  next();
}
