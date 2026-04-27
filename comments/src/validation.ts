import type { ContentfulStatusCode } from "hono/utils/http-status";
import { type Result, ok, err } from "./result.js";

export interface ValidationError {
  message: string;
  status: ContentfulStatusCode;
}

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export const MAX_BODY_LENGTH = 2000;

export function validateSlug(slug: unknown): Result<string, ValidationError> {
  if (typeof slug !== "string") {
    return err({ message: "Slug must be a string", status: 400 });
  }
  if (!SLUG_PATTERN.test(slug)) {
    return err({ message: "Slug must contain only lowercase letters, numbers, and dashes", status: 400 });
  }
  return ok(slug);
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: unknown): Result<string, ValidationError> {
  if (typeof email !== "string") {
    return err({ message: "Email must be a string", status: 400 });
  }
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(trimmed)) {
    return err({ message: "Invalid email address", status: 400 });
  }
  if (trimmed.length > 254) {
    return err({ message: "Email address too long", status: 400 });
  }
  return ok(trimmed);
}

export function validateCommentBody(body: unknown): Result<string, ValidationError> {
  if (typeof body !== "string") {
    return err({ message: "Comment body must be a string", status: 400 });
  }
  if (body.trim().length === 0) {
    return err({ message: "Comment body is required", status: 400 });
  }
  if (body.length > MAX_BODY_LENGTH) {
    return err({
      message: `Comment body must be ${MAX_BODY_LENGTH} characters or less`,
      status: 400,
    });
  }
  return ok(body.trim());
}
