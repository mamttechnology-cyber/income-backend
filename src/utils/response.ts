import { Response } from "express";

export function ok(res: Response, data: unknown = null, message = "Success", status = 200) {
  return res.status(status).json({ success: true, message, data });
}

export function created(res: Response, data: unknown, message = "Created successfully") {
  return ok(res, data, message, 201);
}

export function fail(
  res: Response,
  message: string,
  status = 400,
  errorCode = "BAD_REQUEST",
  details?: unknown
) {
  return res.status(status).json({ success: false, message, errorCode, details });
}
