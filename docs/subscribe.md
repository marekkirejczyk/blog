# Email Subscription Specification

Visitors can subscribe to email notifications by entering their email address. When an admin publishes a new blog post, they manually trigger a notification that sends each confirmed subscriber an email with the post title, an excerpt, and a "Read more" link. Subscriptions use double opt-in and every email includes an unsubscribe link.

## User Flows

### Subscribing

1. Visitor clicks the "Subscribe" button (in the site header or on a blog post page)
2. A dialog opens with an email input and "Subscribe" button
3. Visitor enters their email and submits
4. The API creates a subscriber record (or reuses an existing unconfirmed one) and sends a confirmation email
5. The dialog shows "Check your email to confirm your subscription."

If the email is already confirmed, the API returns "You are already subscribed." without sending another email.

### Confirming Subscription

1. Visitor clicks the confirmation link in the email
2. The link hits `GET /subscribe/confirm?token=...` on the API
3. The API marks the subscriber as confirmed and redirects to `{blogUrl}?subscribed=true`
4. The blog page detects the `?subscribed=true` URL parameter and opens a confirmation dialog: "Subscription confirmed. You will receive notifications for new posts."
5. The URL parameter is removed via `history.replaceState`

### Unsubscribing

1. Subscriber clicks the "Unsubscribe" link in any notification email
2. The link opens a blog page with `?unsubscribe=TOKEN`
3. Client-side JS detects the parameter, calls `GET /subscribe/unsubscribe?token=...`
4. A dialog shows "You have been unsubscribed." (or an error if the token is invalid)
5. The subscriber record is deleted from the database

### Sending Notifications (Admin)

1. Admin navigates to a blog post page
2. The Subscribe section shows a "Send notification" button and notification history (visible only to admins)
3. Admin clicks "Send notification"
4. The API reads the post's markdown, extracts the title and first ~200 words, renders to HTML
5. For each confirmed subscriber who hasn't already been notified for this slug, the API sends a notification email and records it
6. The admin panel updates with the send count and refreshed history

### Viewing Notification History (Admin)

The admin panel on each blog post shows a list of past notifications with the date and subscriber count for each send. Notifications can be sent multiple times (e.g., if new subscribers joined after the first send).

## REST API

Base URL: `https://comments.zkmarek.com` (production), `http://localhost:3001` (development)

### POST /subscribe

Creates a subscriber and sends a confirmation email. No authentication required.

Request:
```json
{ "email": "reader@example.com" }
```

Response (new subscriber): `201`
```json
{ "message": "Check your email to confirm your subscription." }
```

Response (already confirmed): `200`
```json
{ "alreadySubscribed": true, "message": "You're already on the list." }
```

### GET /subscribe/confirm?token=:token

Confirms a subscriber. Redirects to `{blogUrl}?subscribed=true` on success.

Response (invalid token): `404`
```json
{ "error": "Invalid or expired token" }
```

### GET /subscribe/unsubscribe?token=:token

Deletes a subscriber by their unsubscribe token.

Response (success): `200`
```json
{ "message": "You have been unsubscribed." }
```

Response (invalid token): `404`
```json
{ "error": "Invalid token" }
```

### GET /subscribe/status?slug=:slug

Returns notification history for a post. Requires admin session.

Response: `200`
```json
{
  "history": [
    { "sent_at": "2025-06-01T12:00:00.000Z", "count": 5 },
    { "sent_at": "2025-06-03T09:30:00.000Z", "count": 2 }
  ]
}
```

### POST /subscribe/notify

Sends notification emails to all confirmed subscribers who haven't been notified for this slug. Requires admin session.

Request:
```json
{ "slug": "my-new-post" }
```

Response: `200`
```json
{ "sent": 5 }
```

Response (no subscribers to notify): `200`
```json
{ "sent": 0, "message": "No subscribers to notify." }
```

Response (post not found): `404`
```json
{ "error": "Post not found" }
```

## Validation Rules

| Field | Rule |
|---|---|
| `email` | Must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, trimmed, lowercased, max 254 characters |
| `slug` | Lowercase letters, numbers, and dashes only (`/^[a-z0-9-]+$/`) |
| `token` | Required, non-empty string |

## Error Responses

All errors return JSON: `{ "error": "message" }`

| Status | Meaning |
|---|---|
| 400 | Validation error (invalid email, missing token, bad slug) |
| 403 | Not admin (status and notify endpoints) |
| 404 | Token not found or post not found |
| 500 | Failed to send email |

## Database Schema

Two tables in SQLite:

- **subscribers** — `id`, `email` (UNIQUE), `confirmed` (INTEGER, default 0), `confirm_token`, `unsubscribe_token`, `created_at`, `confirmed_at`. Indexed on `confirm_token` and `unsubscribe_token`.
- **notifications_sent** — `id`, `slug`, `subscriber_id` (FK → subscribers), `sent_at`. Indexed on `(slug, subscriber_id)`.

Tokens are generated via `crypto.randomUUID()`. On duplicate email insert, the confirm token is regenerated only if the subscriber is not yet confirmed.

## Architecture

### Routes (`comments/src/routes/subscribe.ts`)

Factory function `subscribeRoutes(options)` returns a Hono router. Options include `emailClient`, `blogUrl`, `callbackBase`, and `contentDir`. Admin endpoints check `ctx.get("user")?.is_admin`.

### Email Client (`comments/src/email/emailClient.ts`)

`EmailClient` interface with a single method:
```ts
sendEmail(to: string, subject: string, html: string): Promise<Result<{ id: string }, EmailError>>
```

Two implementations:
- `ResendEmailClient` — production, wraps the Resend API (`new ResendEmailClient(apiKey, fromEmail)`)
- `ConsoleEmailClient` — development, logs emails to stdout with extracted links (`new ConsoleEmailClient()`)

### Email Templates (`comments/src/email/templates.ts`)

- `confirmationEmailHtml(confirmUrl)` — styled HTML email with a confirmation link
- `notificationEmailHtml({ title, excerptHtml, postUrl, unsubscribeUrl })` — post title, rendered excerpt, "Read more" button, unsubscribe footer

### Excerpt Extraction (`comments/src/email/excerpt.ts`)

`extractExcerpt(content, slug, wordLimit?)` parses YAML frontmatter from a markdown string, takes the first 200 words of the body, renders to HTML via `marked`, and returns `{ title, excerptHtml, heroImage?, tags?, date?, readMinutes? }` — or `null` if frontmatter is missing. `extractExcerptFromPost(contentDir, slug, wordLimit?)` is the I/O wrapper that reads `{contentDir}/{slug}.md` and delegates; returns `null` if the file doesn't exist.

### Data Access (`comments/src/db/subscribers.ts`)

- `insertSubscriber(db, email)` — upsert with `ON CONFLICT`, generates UUID tokens
- `confirmSubscriber(db, token)` → `"confirmed" | "already_confirmed" | "not_found"`
- `unsubscribe(db, token)` → `{ status: "unsubscribed", email } | { status: "not_found" }`
- `getUnnotifiedSubscribers(db, slug)` — confirmed subscribers not yet notified for this slug
- `recordNotification(db, slug, subscriberId)` — inserts a `notifications_sent` row
- `getNotificationHistory(db, slug)` → `Array<{ sent_at: Date, count: number }>`

### App Wiring (`comments/src/app.ts`)

Subscribe routes are mounted conditionally: only when an `emailClient` is available. In production, the client is constructed from `RESEND_API_KEY` (`new ResendEmailClient(...)`). In development, `new ConsoleEmailClient()` is used as a fallback. In tests, an optional `emailClient` can be passed via `TestAppOptions`.

## Blog Integration

### Subscribe Dialog (`blog/src/components/SubscribeDialog.astro`)

Global modal `<dialog>` included in `BaseLayout.astro`. Contains the email form, submit handler, and status messages. Opened by clicking any element with the `data-subscribe-trigger` attribute. Resets form state each time it opens.

### Subscribe Section (`blog/src/components/Subscribe.astro`)

Rendered on each blog post page (via `BlogPost.astro`). Shows a "Subscribe" heading, description, and a button with `data-subscribe-trigger` that opens the subscribe dialog. Below the button, an admin-only notification panel appears if the current user has `is_admin` — displaying notification history and a "Send notification" button.

### Confirmed Dialog (`blog/src/components/SubscribeConfirmedDialog.astro`)

Minimal dialog included in `BaseLayout.astro`. Opens automatically when the URL contains `?subscribed=true`, shows "Subscription confirmed", and removes the URL parameter.

### Unsubscribe Dialog (`blog/src/components/UnsubscribeDialog.astro`)

Minimal dialog included in `BaseLayout.astro`. Opens automatically when the URL contains `?unsubscribe=TOKEN`, calls the unsubscribe API, shows the result, and removes the URL parameter.

### Header Button (`blog/src/layouts/BaseLayout.astro`)

A "Subscribe" pill button in the site header, next to the social links. Uses `data-subscribe-trigger` to open the subscribe dialog.

### Client-Side API (`blog/src/lib/subscribe/api.ts`)

- `subscribe(apiBase, email)` — POST `/subscribe`
- `fetchNotificationStatus(apiBase, slug)` — GET `/subscribe/status?slug=...`
- `sendNotification(apiBase, slug)` — POST `/subscribe/notify`
- `unsubscribeByToken(apiBase, token)` — GET `/subscribe/unsubscribe?token=...`

All functions use `fetch` with `credentials: "include"` for session cookie support.

## Configuration

| Env Var | Default (dev) | Default (prod) | Description |
|---|---|---|---|
| `RESEND_API_KEY` | — | — | Resend API key. If unset in dev, uses console email client |
| `FROM_EMAIL` | `blog@zkmarek.com` | `blog@zkmarek.com` | Sender address for emails |
| `CONTENT_DIR` | `../blog/src/content/blog` | `/var/www/blog-content` | Path to markdown blog posts |

## Testing

- **`comments/tests/subscribe.test.ts`** — integration tests with mock `EmailClient`: subscribe (valid, invalid, already confirmed), confirm (valid, invalid, idempotent), unsubscribe (valid, invalid), notify (non-admin 403, admin sends, no duplicates), status (non-admin 403, admin returns history)
- **`comments/tests/email/excerpt.test.ts`** — excerpt extraction: reads markdown, parses frontmatter, truncates at word limit, returns null for missing files
- **`comments/tests/validation.test.ts`** — email validation: accepts standard emails, lowercases, trims, rejects malformed and oversized addresses
