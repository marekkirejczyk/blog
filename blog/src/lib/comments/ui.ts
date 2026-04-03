export interface Comment {
  id: number;
  body: string;
  author_name: string;
  author_avatar: string | null;
  user_id: number;
  created_at: string;
  replies?: Comment[];
}

export interface User {
  id: number;
  name: string;
  avatar_url: string | null;
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.floor(hours / 24);
  if (days < 30) return days + "d ago";
  return date.toLocaleDateString();
}

export function renderComment(c: Comment, currentUser: User | null): string {
  const replies = c.replies ? c.replies.map((r) => renderComment(r, currentUser)).join("") : "";
  const isOwn = currentUser !== null && currentUser.id === c.user_id;
  const initial = (c.author_name || "?").charAt(0).toUpperCase();
  const avatar = c.author_avatar
    ? '<img src="' + esc(c.author_avatar) + '" class="avatar" alt="" />'
    : '<span class="avatar-placeholder">' + initial + "</span>";

  return (
    '<div class="comment">' +
    '<div class="comment-meta">' +
    avatar +
    "<strong>" +
    esc(c.author_name) +
    "</strong>" +
    '<span class="comment-time">&middot; ' +
    timeAgo(c.created_at) +
    "</span>" +
    "</div>" +
    '<div class="comment-body">' +
    esc(c.body) +
    "</div>" +
    '<div class="comment-actions">' +
    (currentUser
      ? '<a class="reply-btn" data-id="' + c.id + '" data-name="' + esc(c.author_name) + '">Reply</a>'
      : "") +
    (isOwn ? '<a class="delete-btn" data-id="' + c.id + '">Delete</a>' : "") +
    "</div>" +
    (replies ? '<div class="replies">' + replies + "</div>" : "") +
    "</div>"
  );
}
