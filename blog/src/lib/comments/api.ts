import type { Comment, User } from "./ui.js";

async function api(url: string, options?: RequestInit): Promise<Response> {
  return fetch(url, { credentials: "include", ...options });
}

export async function fetchCurrentUser(apiBase: string): Promise<User | null> {
  const res = await api(apiBase + "/auth/me");
  const data = await res.json();
  return data.user ?? null;
}

export async function fetchProviders(apiBase: string): Promise<string[]> {
  const res = await api(apiBase + "/auth/providers");
  const data = await res.json();
  return data.providers ?? [];
}

export async function fetchComments(apiBase: string, slug: string): Promise<Comment[]> {
  const res = await api(apiBase + "/comments?slug=" + encodeURIComponent(slug));
  const data = await res.json();
  return data.comments ?? [];
}

export async function postComment(
  apiBase: string,
  slug: string,
  body: string,
  parentId?: number
): Promise<void> {
  const payload: Record<string, unknown> = { slug, body };
  if (parentId !== undefined) payload.parent_id = parentId;

  const res = await api(apiBase + "/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to post comment");
  }
}

export async function deleteComment(apiBase: string, id: number): Promise<void> {
  const res = await api(apiBase + "/comments/" + id, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete comment");
  }
}

export async function logout(apiBase: string): Promise<void> {
  await api(apiBase + "/auth/logout", { method: "POST" });
}
