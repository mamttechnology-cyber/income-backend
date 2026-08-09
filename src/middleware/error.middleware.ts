import { Request, Response, NextFunction } from "express";
import { AppError } from "../constants/errors";
import { env } from "../config/env";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    errorCode: "NOT_FOUND",
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      success: false,
      message: err.message,
      errorCode: err.errorCode,
      ...(("details" in err && (err as any).details) ? { details: (err as any).details } : {}),
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    errorCode: "INTERNAL_SERVER_ERROR",
    ...(env.nodeEnv !== "production" && err instanceof Error ? { stack: err.stack } : {}),
  });
}
