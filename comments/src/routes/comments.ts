import { Hono } from "hono";
import {
  getCommentsBySlug,
  createComment,
  deleteComment,
  getCommentById,
} from "../db.js";
import type { AppEnv, RouteContext } from "../types.js";
import { validateSlug, validateCommentBody } from "../validation.js";

function handleGetComments(ctx: RouteContext) {
  const slugResult = validateSlug(ctx.req.query("slug"));
  if (!slugResult.ok) {
    return ctx.json({ error: slugResult.error.message }, slugResult.error.status);
  }

  const db = ctx.get("db");
  const comments = getCommentsBySlug(db, slugResult.value);
  return ctx.json({ comments });
}

async function handlePostComment(ctx: RouteContext) {
  const user = ctx.get("user");
  if (!user) {
    return ctx.json({ error: "Unauthorized" }, 401);
  }

  const body = await ctx.req.json().catch(() => null);
  if (!body) {
    return ctx.json({ error: "Invalid JSON body" }, 400);
  }

  const { slug, body: commentBody, parent_id } = body;

  const slugResult = validateSlug(slug);
  if (!slugResult.ok) {
    return ctx.json({ error: slugResult.error.message }, slugResult.error.status);
  }
  const bodyResult = validateCommentBody(commentBody);
  if (!bodyResult.ok) {
    return ctx.json({ error: bodyResult.error.message }, bodyResult.error.status);
  }

  // Validate parent_id exists if provided
  if (parent_id != null) {
    const db = ctx.get("db");
    const parent = getCommentById(db, parent_id);
    if (!parent || parent.deleted_at) {
      return ctx.json({ error: "Parent comment not found" }, 400);
    }
  }

  const db = ctx.get("db");
  const comment = createComment(
    db,
    slugResult.value,
    user.id,
    bodyResult.value,
    parent_id ?? undefined
  );
  return ctx.json(comment, 201);
}

function handleDeleteComment(ctx: RouteContext) {
  const user = ctx.get("user");
  if (!user) {
    return ctx.json({ error: "Unauthorized" }, 401);
  }

  const id = parseInt(ctx.req.param("id"), 10);
  if (isNaN(id)) {
    return ctx.json({ error: "Invalid comment ID" }, 400);
  }

  const db = ctx.get("db");
  const result = deleteComment(db, id, user.id, user.is_admin);

  if (result === "not_found") {
    return ctx.json({ error: "Comment not found" }, 404);
  }
  if (result === "forbidden") {
    return ctx.json({ error: "Not authorized to delete this comment" }, 403);
  }

  return ctx.body(null, 204);
}

export function commentRoutes() {
  const app = new Hono<AppEnv>();
  app.get("/comments", handleGetComments);
  app.post("/comments", handlePostComment);
  app.delete("/comments/:id", handleDeleteComment);
  return app;
}
