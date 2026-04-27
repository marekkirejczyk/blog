import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import {
  confirmationEmailHtml,
  notificationEmailHtml,
  unsubscribedEmailHtml,
} from "../email/templates.js";

interface DevEmailsOptions {
  blogUrl: string;
}

export function devEmailRoutes(options: DevEmailsOptions) {
  const { blogUrl } = options;
  const app = new Hono<AppEnv>();

  app.get("/dev/emails", (c) =>
    c.html(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8" /><title>Email previews</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 4rem auto; padding: 0 1rem; color: #14171a; }
  h1 { font-size: 22px; margin-bottom: 1rem; }
  ul { padding-left: 1.25rem; line-height: 2; }
  a { color: #1a59d9; }
</style></head>
<body>
  <h1>Email template previews</h1>
  <ul>
    <li><a href="/dev/emails/confirmation">Confirmation</a></li>
    <li><a href="/dev/emails/notification">New-post notification</a></li>
    <li><a href="/dev/emails/notification?minimal=1">New-post notification (minimal — no hero/tags/meta)</a></li>
    <li><a href="/dev/emails/unsubscribed">Unsubscribed</a></li>
  </ul>
</body></html>`)
  );

  app.get("/dev/emails/confirmation", (c) =>
    c.html(
      confirmationEmailHtml(
        `${blogUrl}/subscribe/confirm?token=demo-token`,
        blogUrl
      )
    )
  );

  app.get("/dev/emails/notification", (c) => {
    const minimal = c.req.query("minimal") === "1";
    const base = {
      title: "How Rust's Borrow Checker Changed the Way I Write Code",
      excerptHtml:
        "<p>A decade of writing <strong>C++</strong> left me with habits I didn't even notice — until the borrow checker started rejecting them. This post walks through three patterns I had to unlearn.</p>" +
        "<p>The first surprise was <em>aliasing</em>. In C++ it's fine to hand out two mutable pointers to the same object; in Rust it's a compile error...</p>",
      postUrl: `${blogUrl}/blog/rust-borrow-checker/`,
      unsubscribeUrl: `${blogUrl}/subscribe/unsubscribe?token=demo-token`,
      blogUrl,
    };
    const opts = minimal
      ? base
      : {
          ...base,
          heroImage: `${blogUrl}/images/avatar.png`,
          tags: ["rust", "software-engineering", "learning"],
          date: "Apr 18, 2026",
          readMinutes: 6,
        };
    return c.html(notificationEmailHtml(opts));
  });

  app.get("/dev/emails/unsubscribed", (c) => c.html(unsubscribedEmailHtml(blogUrl)));

  return app;
}
