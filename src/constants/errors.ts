export class AppError extends Error {
  status: number;
  errorCode: string;

  constructor(message: string, status = 400, errorCode = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  details: unknown;
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 422, "VALIDATION_ERROR");
    this.details = details;
  }
}
