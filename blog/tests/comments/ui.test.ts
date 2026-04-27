import { describe, it, expect } from "vitest";
import { esc, renderComment, renderUserInfo, renderLoginButtons } from "../../src/lib/comments/ui.js";
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
        '<div class="comment-body"><p>Hello world</p></div>' +
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
        '<div class="comment-body"><p>Hello world</p></div>' +
        '<div class="comment-actions"></div>' +
      "</div>"
    );
  });

  it("renders reply button when logged in as another user", () => {
    const user: User = { id: 99, name: "Bob", avatar_url: null, is_admin: false };
    expect(renderComment(baseComment, user)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body"><p>Hello world</p></div>' +
        '<div class="comment-actions">' +
          '<a class="reply-btn" data-id="1" data-name="Alice">Reply</a>' +
        "</div>" +
      "</div>"
    );
  });

  it("renders reply and delete buttons for own comment", () => {
    const user: User = { id: 42, name: "Alice", avatar_url: null, is_admin: false };
    expect(renderComment(baseComment, user)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body"><p>Hello world</p></div>' +
        '<div class="comment-actions">' +
          '<a class="reply-btn" data-id="1" data-name="Alice">Reply</a>' +
          '<a class="delete-btn" data-id="1">Delete</a>' +
        "</div>" +
      "</div>"
    );
  });

  it("renders delete button for admin on other user's comment", () => {
    const admin: User = { id: 99, name: "Admin", avatar_url: null, is_admin: true };
    expect(renderComment(baseComment, admin)).toBe(
      '<div class="comment">' +
        '<div class="comment-meta">' +
          '<img src="https://example.com/avatar.png" class="avatar" alt="" />' +
          "<strong>Alice</strong>" +
          '<span class="comment-time">&middot; just now</span>' +
        "</div>" +
        '<div class="comment-body"><p>Hello world</p></div>' +
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
        '<div class="comment-body"><p>Hello world</p></div>' +
        '<div class="comment-actions"></div>' +
        '<div class="replies">' +
          '<div class="comment">' +
            '<div class="comment-meta">' +
              '<span class="avatar-placeholder">B</span>' +
              "<strong>Bob</strong>" +
              '<span class="comment-time">&middot; just now</span>' +
            "</div>" +
            '<div class="comment-body"><p>Reply here</p></div>' +
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
        '<div class="comment-body"><p>&lt;script&gt;xss&lt;/script&gt;</p></div>' +
        '<div class="comment-actions"></div>' +
      "</div>"
    );
  });
});

describe("renderUserInfo", () => {
  it("renders user with avatar", () => {
    const user: User = { id: 1, name: "Alice", avatar_url: "https://example.com/a.png", is_admin: false };
    const html = renderUserInfo(user);
    expect(html).toContain('class="user-info"');
    expect(html).toContain('src="https://example.com/a.png"');
    expect(html).toContain("Alice");
    expect(html).toContain('id="logout-btn"');
    expect(html).not.toContain("admin-badge");
  });

  it("renders admin badge", () => {
    const user: User = { id: 1, name: "Admin", avatar_url: null, is_admin: true };
    const html = renderUserInfo(user);
    expect(html).toContain("admin-badge");
    expect(html).toContain("admin");
  });

  it("omits avatar img when avatar_url is null", () => {
    const user: User = { id: 1, name: "Bob", avatar_url: null, is_admin: false };
    const html = renderUserInfo(user);
    expect(html).not.toContain("<img");
    expect(html).toContain("Bob");
  });

  it("escapes user name", () => {
    const user: User = { id: 1, name: "<script>xss</script>", avatar_url: null, is_admin: false };
    const html = renderUserInfo(user);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("renderLoginButtons", () => {
  it("renders message when no providers", () => {
    const html = renderLoginButtons([], "http://api", "http://blog");
    expect(html).toContain("no providers configured");
  });

  it("renders a single provider button", () => {
    const html = renderLoginButtons(["github"], "http://api", "http://blog/post");
    expect(html).toContain("Sign in with");
    expect(html).toContain('href="http://api/auth/github?redirect=');
    expect(html).toContain("Github");
    expect(html).toContain("login-github");
  });

  it("renders multiple provider buttons", () => {
    const html = renderLoginButtons(["github", "google"], "http://api", "http://blog");
    expect(html).toContain("login-github");
    expect(html).toContain("login-google");
  });

  it("encodes redirect URL", () => {
    const html = renderLoginButtons(["github"], "http://api", "http://blog/post?a=1&b=2");
    expect(html).toContain(encodeURIComponent("http://blog/post?a=1&b=2"));
  });

  it("includes privacy note", () => {
    const html = renderLoginButtons(["github"], "http://api", "http://blog");
    expect(html).toContain("Privacy Policy");
    expect(html).toContain("/privacy/");
  });
});
