import { describe, it, expect } from "vitest";
import { esc, timeAgo, renderComment } from "../../src/lib/comments/ui.js";
import type { Comment, User } from "../../src/lib/comments/ui.js";

describe("esc", () => {
  it("escapes HTML entities", () => {
    expect(esc("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(esc("a & b")).toBe("a &amp; b");
  });

  it("returns empty string for empty input", () => {
    expect(esc("")).toBe("");
  });

  it("leaves plain text unchanged", () => {
    expect(esc("hello world")).toBe("hello world");
  });
});

describe("timeAgo", () => {
  it("returns 'just now' for recent dates", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("returns minutes ago", () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe("5m ago");
  });

  it("returns hours ago", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(threeHoursAgo)).toBe("3h ago");
  });

  it("returns days ago", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(timeAgo(twoDaysAgo)).toBe("2d ago");
  });

  it("returns formatted date for old dates", () => {
    const old = new Date("2020-01-15").toISOString();
    const result = timeAgo(old);
    expect(result).not.toContain("d ago");
    expect(result).not.toBe("just now");
  });
});

describe("renderComment", () => {
  const created_at = new Date().toISOString();

  const baseComment: Comment = {
    id: 1,
    body: "Hello world",
    author_name: "Alice",
    author_avatar: "https://example.com/avatar.png",
    user_id: 42,
    created_at,
  };

  it("renders comment with avatar, not logged in", () => {
    expect(renderComment(baseComment, null)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body">Hello world</div>' +
        '<div class="comment-actions"></div>' +
      "</div>"
    );
  });

  it("renders avatar placeholder when no avatar", () => {
    const comment = { ...baseComment, author_avatar: null };
    expect(renderComment(comment, null)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<span class="avatar-placeholder">A</span>' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body">Hello world</div>' +
        '<div class="comment-actions"></div>' +
      "</div>"
    );
  });

  it("renders reply button when logged in as another user", () => {
    const user: User = { id: 99, name: "Bob", avatar_url: null };
    expect(renderComment(baseComment, user)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body">Hello world</div>' +
        '<div class="comment-actions">' +
          '<a class="reply-btn" data-id="1" data-name="Alice">Reply</a>' +
        "</div>" +
      "</div>"
    );
  });

  it("renders reply and delete buttons for own comment", () => {
    const user: User = { id: 42, name: "Alice", avatar_url: null };
    expect(renderComment(baseComment, user)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body">Hello world</div>' +
        '<div class="comment-actions">' +
          '<a class="reply-btn" data-id="1" data-name="Alice">Reply</a>' +
          '<a class="delete-btn" data-id="1">Delete</a>' +
        "</div>" +
      "</div>"
    );
  });

  it("renders nested replies", () => {
    const reply: Comment = {
      id: 2,
      body: "Reply here",
      author_name: "Bob",
      author_avatar: null,
      user_id: 99,
      created_at,
    };
    const comment = { ...baseComment, replies: [reply] };
    expect(renderComment(comment, null)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body">Hello world</div>' +
        '<div class="comment-actions"></div>' +
        '<div class="replies">' +
          '<div class="comment">' +
            '<div class="comment-meta">' +
              '<span class="avatar-placeholder">B</span>' +
              "<strong>Bob</strong>" +
              '<span class="comment-time">&middot; just now</span>' +
            "</div>" +
            '<div class="comment-body">Reply here</div>' +
            '<div class="comment-actions"></div>' +
          "</div>" +
        "</div>" +
      "</div>"
    );
  });

  it("escapes HTML in body and author name", () => {
    const comment: Comment = {
      ...baseComment,
      body: "<script>xss</script>",
      author_name: "<b>hacker</b>",
    };
    expect(renderComment(comment, null)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>&lt;b&gt;hacker&lt;/b&gt;</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body">&lt;script&gt;xss&lt;/script&gt;</div>' +
        '<div class="comment-actions"></div>' +
      "</div>"
    );
  });
});
