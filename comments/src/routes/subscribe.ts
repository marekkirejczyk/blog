import { Hono } from "hono";
import type { AppEnv, RouteContext } from "../types.js";
import type { EmailClient } from "../email/emailClient.js";
import { validateEmail, validateSlug } from "../validation.js";
import {
  insertSubscriber,
  confirmSubscriber,
  unsubscribe,
  getUnnotifiedSubscribers,
  recordNotification,
  getNotificationHistory,
} from "../db/index.js";
import {
  confirmationEmailHtml,
  notificationEmailHtml,
  unsubscribedEmailHtml,
} from "../email/templates.js";
import { extractExcerptFromPost } from "../email/excerpt.js";

export interface SubscribeRoutesOptions {
  emailClient: EmailClient;
  blogUrl: string;
  callbackBase: string;
  contentDir: string;
}

export function subscribeRoutes(options: SubscribeRoutesOptions) {
  const app = new Hono<AppEnv>();
  const { emailClient, blogUrl, callbackBase, contentDir } = options;

  app.post("/subscribe", async (ctx: RouteContext) => {
    const body = await ctx.req.json().catch(() => null);
    if (!body) {
      return ctx.json({ error: "Invalid JSON body" }, 400);
    }

    const emailResult = validateEmail(body.email);
    if (!emailResult.ok) {
      return ctx.json({ error: emailResult.error.message }, emailResult.error.status);
    }

    const db = ctx.get("db");
    const subscriber = insertSubscriber(db, emailResult.value);

    if (subscriber.confirmed) {
      return ctx.json({
        alreadySubscribed: true,
        message: "You're already on the list.",
      });
    }

    const confirmUrl = `${callbackBase}/subscribe/confirm?token=${subscriber.confirm_token}`;
    const result = await emailClient.sendEmail(
      subscriber.email,
      "Confirm your subscription",
      confirmationEmailHtml(confirmUrl, blogUrl)
    );

    if (!result.ok) {
      return ctx.json({ error: "Failed to send confirmation email" }, 500);
    }

    return ctx.json({ message: "Check your email to confirm your subscription." }, 201);
  });

  app.get("/subscribe/confirm", (ctx: RouteContext) => {
    const token = ctx.req.query("token");
    if (!token) {
      return ctx.json({ error: "Token is required" }, 400);
    }

    const db = ctx.get("db");
    const result = confirmSubscriber(db, token);

    if (result === "not_found") {
      return ctx.json({ error: "Invalid or expired token" }, 404);
    }

    return ctx.redirect(`${blogUrl}?subscribed=true`);
  });

  app.get("/subscribe/unsubscribe", async (ctx: RouteContext) => {
    const token = ctx.req.query("token");
    if (!token) {
      return ctx.json({ error: "Token is required" }, 400);
    }

    const db = ctx.get("db");
    const result = unsubscribe(db, token);

    if (result.status === "not_found") {
      return ctx.json({ error: "Invalid token" }, 404);
    }

    // Fire-and-forget farewell email (don't block the response on it)
    emailClient
      .sendEmail(result.email, "You've been unsubscribed from zkMarek", unsubscribedEmailHtml(blogUrl))
      .catch(() => {});

    return ctx.json({ message: "You have been unsubscribed." });
  });

  app.get("/subscribe/status", (ctx: RouteContext) => {
    const user = ctx.get("user");
    if (!user?.is_admin) {
      return ctx.json({ error: "Forbidden" }, 403);
    }

    const slugResult = validateSlug(ctx.req.query("slug"));
    if (!slugResult.ok) {
      return ctx.json({ error: slugResult.error.message }, slugResult.error.status);
    }

    const db = ctx.get("db");
    const history = getNotificationHistory(db, slugResult.value);

    return ctx.json({ history });
  });

  app.post("/subscribe/notify", async (ctx: RouteContext) => {
    const user = ctx.get("user");
    if (!user?.is_admin) {
      return ctx.json({ error: "Forbidden" }, 403);
    }

    const body = await ctx.req.json().catch(() => null);
    if (!body) {
      return ctx.json({ error: "Invalid JSON body" }, 400);
    }

    const slugResult = validateSlug(body.slug);
    if (!slugResult.ok) {
      return ctx.json({ error: slugResult.error.message }, slugResult.error.status);
    }
    const slug = slugResult.value;

    const excerpt = extractExcerptFromPost(contentDir, slug);
    if (!excerpt) {
      return ctx.json({ error: "Post not found" }, 404);
    }

    const db = ctx.get("db");
    const subscribers = getUnnotifiedSubscribers(db, slug);

    if (subscribers.length === 0) {
      return ctx.json({ sent: 0, message: "No subscribers to notify." });
    }

    const postUrl = `${blogUrl}/blog/${slug}/`;
    let sent = 0;

    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${blogUrl}?unsubscribe=${subscriber.unsubscribe_token}`;
      const result = await emailClient.sendEmail(
        subscriber.email,
        `New post: ${excerpt.title}`,
        notificationEmailHtml({
          title: excerpt.title,
          excerptHtml: excerpt.excerptHtml,
          postUrl,
          unsubscribeUrl,
          heroImage: excerpt.heroImage,
          blogUrl,
          tags: excerpt.tags,
          date: excerpt.date,
          readMinutes: excerpt.readMinutes,
        })
      );

      if (result.ok) {
        recordNotification(db, slug, subscriber.id);
        sent++;
      }
    }

    return ctx.json({ sent });
  });

  return app;
}
