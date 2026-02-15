// Standardized error classes for the application

export class NotFoundError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ValidationError";
  }
}

export class AuthenticationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AuthorizationError";
  }
}

export class GitHubError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "GitHubError";
  }
}

export class SupabaseError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "SupabaseError";
  }
}

export class StripeError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "StripeError";
  }
}

export class AutopilotError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "AutopilotError";
  }
}

export function isNotFoundError(error: any): error is NotFoundError {
  return error instanceof NotFoundError || error?.name === "NotFoundError";
}

export function isValidationError(error: any): error is ValidationError {
  return error instanceof ValidationError || error?.name === "ValidationError";
}

export function handleError(error: any): { message: string; status: number } {
  if (isNotFoundError(error)) {
    return { message: error.message, status: 404 };
  }

  if (isValidationError(error)) {
    return { message: error.message, status: 400 };
  }

  if (error instanceof AuthenticationError) {
    return { message: error.message, status: 401 };
  }

  if (error instanceof AuthorizationError) {
    return { message: error.message, status: 403 };
  }

  // Default to 500 for unknown errors
  return { message: "Internal server error", status: 500 };
}
