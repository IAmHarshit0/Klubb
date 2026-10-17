import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.name === "ValidationError" ? 400 : 500);
  const message = err.message || "Internal Server Error";

  if (statusCode === 500) {
    console.error("Unhandled Error:", err);
  }

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
    },
  });
}
