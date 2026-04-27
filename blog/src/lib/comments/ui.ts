import { marked } from "marked";
import { timeAgo } from "../date.js";

export { timeAgo };

marked.setOptions({ breaks: true, gfm: true, async: false });

export interface Comment {
  id: number;
  body: string;
  author_name: string;
  author_avatar: string | null;
  author_profile_url: string | null;
  user_id: number;
  created_at: string;
  replies?: Comment[];
}

export interface User {
  id: number;
  name: string;
  avatar_url: string | null;
  is_admin: boolean;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(text: string): string {
  // Escape HTML first to prevent XSS, then parse markdown
  const escaped = esc(text);
  return (marked.parse(escaped) as string).trim();
}

const providerIcons: Record<string, string> = {
  github: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>',
  google: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M15.545 6.558a9.4 9.4 0 01.139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 018 0a7.689 7.689 0 015.352 2.082l-2.284 2.284A4.347 4.347 0 008 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.79 4.79 0 000 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 001.599-2.431H8V6.558h7.545z"/></svg>',
  facebook: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0 0 3.603 0 8.05 0 12.07 2.925 15.43 6.75 16v-5.624H4.718V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.571 6.75-3.93 6.75-7.951z"/></svg>',
  linkedin: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>',
  x: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633z"/></svg>',
};

export function renderUserInfo(user: User): string {
  const initial = (user.name || "?").charAt(0).toUpperCase();
  const avatar = user.avatar_url
    ? '<img src="' + esc(user.avatar_url) + '" class="avatar" alt="" />'
    : '<span class="avatar-placeholder">' + esc(initial) + "</span>";

  return (
    '<div class="user-row">' +
      '<span class="user-info">' +
        avatar +
        '<span class="user-name">' + esc(user.name) + "</span>" +
        (user.is_admin ? '<span class="admin-badge">admin</span>' : "") +
      "</span>" +
      '<a id="logout-btn" class="auth-link">Logout</a>' +
    "</div>"
  );
}

export function renderLoginButtons(providers: string[], apiBase: string, redirectUrl: string): string {
  if (providers.length === 0) {
    return '<span class="status">Comments require login (no providers configured)</span>';
  }

  const buttons = providers
    .map((p) => {
      const label = p.charAt(0).toUpperCase() + p.slice(1);
      const icon = providerIcons[p] || "";
      return (
        '<a href="' + apiBase + "/auth/" + p + "?redirect=" + encodeURIComponent(redirectUrl) +
        '" class="login-btn login-' + p + '">' + icon + label + "</a>"
      );
    })
    .join("");

  return (
    '<div class="login-card">' +
      '<h3 class="login-title">Join the conversation</h3>' +
      '<p class="login-blurb">Sign in to post a comment. We never spam, and your email stays private.</p>' +
      '<p class="login-label">Sign in with:</p>' +
      '<div class="login-buttons">' + buttons + "</div>" +
      '<p class="privacy-note">By signing in, you agree to our <a href="/privacy/">Privacy Policy</a>.</p>' +
    "</div>"
  );
}

export function renderComment(c: Comment, currentUser: User | null): string {
  const replies = c.replies ? c.replies.map((r) => renderComment(r, currentUser)).join("") : "";
  const isOwn = currentUser !== null && currentUser.id === c.user_id;
  const canDelete = currentUser !== null && (isOwn || currentUser.is_admin);
  const initial = (c.author_name || "?").charAt(0).toUpperCase();
  const avatar = c.author_avatar
    ? '<img src="' + esc(c.author_avatar) + '" class="avatar" alt="" />'
    : '<span class="avatar-placeholder">' + initial + "</span>";

  return (
    '<div class="comment">' +
    '<div class="comment-meta">' +
    avatar +
    (c.author_profile_url
      ? '<a href="' + esc(c.author_profile_url) + '" target="_blank" rel="noopener noreferrer" class="comment-author"><strong>' + esc(c.author_name) + "</strong></a>"
      : "<strong>" + esc(c.author_name) + "</strong>") +
    '<span class="comment-time">&middot; ' +
    timeAgo(c.created_at) +
    "</span>" +
    "</div>" +
    '<div class="comment-body">' +
    renderMarkdown(c.body) +
    "</div>" +
    '<div class="comment-actions">' +
    (currentUser
      ? '<a class="reply-btn" data-id="' + c.id + '" data-name="' + esc(c.author_name) + '">Reply</a>'
      : "") +
    (canDelete ? '<a class="delete-btn" data-id="' + c.id + '">Delete</a>' : "") +
    "</div>" +
    (replies ? '<div class="replies">' + replies + "</div>" : "") +
    "</div>"
  );
}
