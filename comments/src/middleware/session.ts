import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types.js";
import { getSessionWithUser } from "../db/sessions.js";

export const SESSION_COOKIE = "session_id";

export function sessionMiddleware(): MiddlewareHandler<AppEnv> {
  return async (ctx, next) => {
    const sessionId = getCookie(ctx, SESSION_COOKIE);
    if (sessionId) {
      const db = ctx.get("db");
      const result = getSessionWithUser(db, sessionId);
      if (result) {
        ctx.set("user", {
          id: result.user.id,
          name: result.user.name,
          avatar_url: result.user.avatar_url,
          is_admin: !!result.user.is_admin,
        });
      }
    }
    await next();
  };
}
