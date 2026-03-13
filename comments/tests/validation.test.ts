import { describe, it, expect } from "vitest";
import { validateSlug, validateCommentBody, MAX_BODY_LENGTH } from "../src/validation.js";

describe("validateSlug", () => {
  it("accepts lowercase alphanumeric with dashes", () => {
    expect(validateSlug("hello-world")).toEqual({ ok: true, value: "hello-world" });
    expect(validateSlug("post-123")).toEqual({ ok: true, value: "post-123" });
    expect(validateSlug("a")).toEqual({ ok: true, value: "a" });
  });

  it("rejects non-string types with type error", () => {
    const result = validateSlug(null);
    expect(result).toEqual({ ok: false, error: { message: "Slug must be a string", status: 400 } });
    expect(validateSlug(undefined).ok).toBe(false);
    expect(validateSlug(123).ok).toBe(false);
  });

  it("rejects invalid pattern with pattern error", () => {
    const result = validateSlug("Hello-World");
    expect(result).toEqual({ ok: false, error: { message: "Slug must contain only lowercase letters, numbers, and dashes", status: 400 } });
    expect(validateSlug("hello world").ok).toBe(false);
    expect(validateSlug("hello_world").ok).toBe(false);
    expect(validateSlug("hello.world").ok).toBe(false);
    expect(validateSlug("hello!").ok).toBe(false);
  });

  it("rejects empty string with pattern error", () => {
    const result = validateSlug("");
    expect(result).toEqual({ ok: false, error: { message: "Slug must contain only lowercase letters, numbers, and dashes", status: 400 } });
  });
});

describe("validateCommentBody", () => {
  it("accepts normal text and trims it", () => {
    expect(validateCommentBody("Hello world!")).toEqual({ ok: true, value: "Hello world!" });
    expect(validateCommentBody("  padded  ")).toEqual({ ok: true, value: "padded" });
  });

  it("accepts body at max length", () => {
    const body = "x".repeat(MAX_BODY_LENGTH);
    const result = validateCommentBody(body);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(body);
    }
  });

  it("rejects non-string types with type error", () => {
    const result = validateCommentBody(null);
    expect(result).toEqual({ ok: false, error: { message: "Comment body must be a string", status: 400 } });
    expect(validateCommentBody(undefined).ok).toBe(false);
    expect(validateCommentBody(42).ok).toBe(false);
    expect(validateCommentBody({}).ok).toBe(false);
  });

  it("rejects empty string with required error", () => {
    expect(validateCommentBody("")).toEqual({ ok: false, error: { message: "Comment body is required", status: 400 } });
  });

  it("rejects whitespace-only string with required error", () => {
    expect(validateCommentBody("   ")).toEqual({ ok: false, error: { message: "Comment body is required", status: 400 } });
    expect(validateCommentBody("\n\t").ok).toBe(false);
  });

  it("rejects body exceeding max length with length error", () => {
    const result = validateCommentBody("x".repeat(MAX_BODY_LENGTH + 1));
    expect(result).toEqual({ ok: false, error: { message: `Comment body must be ${MAX_BODY_LENGTH} characters or less`, status: 400 } });
  });
});
