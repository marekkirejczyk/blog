// Email templates — HTML emails with responsive layout for desktop, tablet, and mobile.
// Uses inline styles (email client compatibility) + a <style> block with media queries.
// Colors and fonts mirror the blog's design system.

const CURRENT_YEAR = new Date().getFullYear();

const BASE_STYLES = `
  body {
    margin: 0;
    padding: 0;
    background: #f7f7f9;
    font-family: 'Source Serif Pro', Georgia, 'Times New Roman', Times, serif;
    color: #14171a;
    -webkit-font-smoothing: antialiased;
  }
  a { color: #1a59d9; }
  .email-wrap {
    width: 100%;
    background: #f7f7f9;
    padding: 24px 12px;
    box-sizing: border-box;
  }
  .email-card {
    max-width: 600px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #ebedf0;
    border-radius: 12px;
    padding: 48px 40px;
    box-sizing: border-box;
  }
  .email-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: #1a59d9;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-weight: 600;
    font-size: 17px;
    margin-bottom: 28px;
  }
  .email-brand img {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: block;
  }
  .email-brand span {
    text-decoration: underline;
  }
  .email-title {
    font-family: 'Source Serif Pro', Georgia, 'Times New Roman', Times, serif;
    font-weight: 700;
    font-size: 30px;
    line-height: 1.2;
    color: #14171a;
    margin: 0 0 20px 0;
  }
  .email-body {
    font-family: 'Source Serif Pro', Georgia, 'Times New Roman', Times, serif;
    font-weight: 400;
    font-size: 16px;
    line-height: 1.7;
    color: #14171a;
    margin: 0 0 20px 0;
  }
  .email-body a { color: #1a59d9; }
  .email-cta {
    display: inline-block;
    background: #142447;
    color: #ffffff !important;
    text-decoration: none;
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-weight: 500;
    font-size: 15px;
    padding: 14px 24px;
    border-radius: 999px;
    margin: 8px 0 4px;
  }
  .email-small {
    font-family: 'Source Serif Pro', Georgia, 'Times New Roman', Times, serif;
    font-size: 13px;
    line-height: 1.6;
    color: #737880;
    margin: 12px 0 0 0;
  }
  .email-footer {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.6;
    color: #737880;
    margin: 24px 0 0 0;
    padding-top: 24px;
    border-top: 1px solid #ebedf0;
  }
  .email-footer a { color: #1a59d9; font-weight: 500; }
  .email-hero {
    width: 100%;
    max-width: 520px;
    border-radius: 6px;
    margin: 0 0 18px 0;
    display: block;
  }
  .email-meta {
    font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #737880;
    margin: 0 0 18px 0;
  }
  .email-content { font-family: 'Source Serif Pro', Georgia, 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.7; color: #14171a; }
  .email-content h2, .email-content h3 { font-weight: 700; color: #14171a; }
  .email-content h2 { font-size: 22px; line-height: 1.3; margin: 24px 0 8px; }
  .email-content h3 { font-size: 18px; line-height: 1.3; margin: 20px 0 6px; }
  .email-content p { margin: 0 0 18px; }
  .email-content ul, .email-content ol { padding-left: 20px; margin: 0 0 18px; }
  .email-content li { margin-bottom: 6px; }
  .email-content a { color: #1a59d9; }

  /* Tablet */
  @media (max-width: 640px) {
    .email-card { padding: 40px 32px; }
    .email-title { font-size: 28px; }
  }
  /* Mobile */
  @media (max-width: 440px) {
    .email-wrap { padding: 16px 0; }
    .email-card { border-radius: 0; border-left: 0; border-right: 0; padding: 32px 24px; }
    .email-title { font-size: 24px; line-height: 1.25; }
    .email-body { font-size: 15px; }
  }
`;

function brandHtml(blogUrl: string): string {
  return `<a href="${blogUrl}" class="email-brand" style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:#1a59d9;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-weight:600;font-size:17px;">
    <img src="${blogUrl}/images/avatar-small.png" width="26" height="26" alt="" style="width:26px;height:26px;border-radius:50%;display:block;" />
    <span style="text-decoration:underline;">zkMarek</span>
  </a>`;
}

function wrap(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="email-wrap">
    <div class="email-card">
${inner}
    </div>
  </div>
</body>
</html>`;
}

export function confirmationEmailHtml(confirmUrl: string, blogUrl: string): string {
  return wrap(`
      ${brandHtml(blogUrl)}
      <h1 class="email-title">Confirm your subscription</h1>
      <p class="email-body">You requested to receive notifications when new blog posts are published on <a href="${blogUrl}">zkMarek</a> — essays on AI, cryptography, software engineering, entrepreneurship, and management. Tap the button below to confirm.</p>
      <p style="margin:8px 0 4px;">
        <a href="${confirmUrl}" class="email-cta">Confirm subscription</a>
      </p>
      <p class="email-small">If you didn't request this, you can safely ignore this email — we won't contact you again.</p>
      <p class="email-footer">© ${CURRENT_YEAR} zkMarek</p>
  `);
}

export interface NotificationEmailOptions {
  title: string;
  excerptHtml: string;
  postUrl: string;
  unsubscribeUrl: string;
  heroImage?: string;
  blogUrl: string;
  tags?: string[];
  date?: string;
  readMinutes?: number;
}

export function notificationEmailHtml(opts: NotificationEmailOptions): string {
  const tagsHtml = opts.tags && opts.tags.length > 0
    ? `<p style="margin:0 0 14px;">${opts.tags.map((t) =>
        `<span style="display:inline-block;background:#f2f2f7;color:#14171a;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-weight:500;font-size:11px;padding:4px 10px;border-radius:999px;margin-right:6px;">${escapeHtml(t)}</span>`
      ).join("")}</p>`
    : "";

  const metaParts: string[] = [];
  if (opts.date) metaParts.push(escapeHtml(opts.date));
  if (opts.readMinutes) metaParts.push(`${opts.readMinutes} min read`);
  const metaHtml = metaParts.length > 0
    ? `<p class="email-meta">${metaParts.join(" &middot; ")}</p>`
    : "";

  const heroHtml = opts.heroImage
    ? `<img class="email-hero" src="${escapeHtml(opts.heroImage)}" alt="" />`
    : "";

  return wrap(`
      ${brandHtml(opts.blogUrl)}
      ${heroHtml}
      ${tagsHtml}
      <h1 class="email-title">${escapeHtml(opts.title)}</h1>
      ${metaHtml}
      <div class="email-content">
        ${opts.excerptHtml}
      </div>
      <p style="margin:8px 0 4px;">
        <a href="${opts.postUrl}" class="email-cta">Read the full post</a>
      </p>
      <p class="email-footer">
        You received this email because you subscribed to <a href="${opts.blogUrl}">zkMarek</a>.<br />
        <a href="${opts.unsubscribeUrl}">Unsubscribe</a> &nbsp;·&nbsp; <a href="${opts.postUrl}">View in browser</a>
      </p>
  `);
}

export function unsubscribedEmailHtml(blogUrl: string): string {
  const resubscribeUrl = `${blogUrl}/?resubscribe=true`;
  return wrap(`
      ${brandHtml(blogUrl)}
      <h1 class="email-title">You've been unsubscribed</h1>
      <p class="email-body">You will no longer receive new posts from zkMarek. Thanks for reading — I hope some of it was useful.</p>
      <p class="email-body">If this was a mistake, you can resubscribe anytime with a single click.</p>
      <p style="margin:8px 0 4px;">
        <a href="${resubscribeUrl}" class="email-cta">Resubscribe</a>
      </p>
      <p class="email-footer">
        You received this email because you subscribed to <a href="${blogUrl}">zkMarek</a>.<br />
        © ${CURRENT_YEAR} zkMarek
      </p>
  `);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
