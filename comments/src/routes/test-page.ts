import { Hono } from "hono";
import { html } from "hono/html";

export function testPageRoute() {
  const app = new Hono();

  app.get("/test", (c) => {
    return c.html(html`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Comment System Test</title>
          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: Georgia, "Times New Roman", serif;
              color: #1a1a1a;
              background: #fff;
              line-height: 1.7;
              max-width: 680px;
              margin: 2rem auto;
              padding: 0 1rem;
            }
            h1 {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
                Helvetica, Arial, sans-serif;
              font-size: 1.5rem;
              margin-bottom: 1.5rem;
            }
            .comment {
              border-top: 1px solid #eee;
              padding: 1rem 0;
            }
            .comment-meta {
              font-size: 0.85rem;
              color: #999;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              margin-bottom: 0.25rem;
            }
            .comment-body {
              margin-bottom: 0.5rem;
            }
            .comment-actions {
              font-size: 0.8rem;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            .comment-actions a {
              color: #666;
              cursor: pointer;
              margin-right: 0.75rem;
            }
            .comment-actions a:hover {
              color: #1a1a1a;
            }
            .replies {
              margin-left: 2rem;
              border-left: 2px solid #eee;
              padding-left: 1rem;
            }
            .compose {
              margin-bottom: 2rem;
            }
            textarea {
              width: 100%;
              min-height: 80px;
              padding: 0.75rem;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-family: inherit;
              font-size: 0.95rem;
              resize: vertical;
              margin-bottom: 0.5rem;
            }
            button {
              background: #1a1a1a;
              color: #fff;
              border: none;
              padding: 0.5rem 1.25rem;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.9rem;
            }
            button:hover {
              background: #333;
            }
            .status {
              color: #999;
              font-style: italic;
              font-size: 0.9rem;
            }
            #reply-info {
              font-size: 0.85rem;
              color: #666;
              margin-bottom: 0.5rem;
              display: none;
            }
            #reply-info a {
              color: #999;
              cursor: pointer;
            }
          </style>
        </head>
        <body>
          <h1>Comment Test — test-post</h1>

          <div class="compose">
            <div id="reply-info">
              Replying to comment
              <span id="reply-parent-id"></span>
              — <a onclick="cancelReply()">cancel</a>
            </div>
            <textarea id="body" placeholder="Write a comment..."></textarea>
            <button onclick="postComment()">Post Comment</button>
          </div>

          <div id="comments"><p class="status">Loading...</p></div>

          <script>
            const SLUG = "test-post";
            let replyTo = null;

            async function loadComments() {
              const res = await fetch("/comments?slug=" + SLUG);
              const data = await res.json();
              const el = document.getElementById("comments");
              if (data.comments.length === 0) {
                el.innerHTML = '<p class="status">No comments yet.</p>';
                return;
              }
              el.innerHTML = data.comments.map(renderComment).join("");
            }

            function renderComment(c) {
              const replies = c.replies
                ? c.replies.map(renderComment).join("")
                : "";
              return (
                '<div class="comment">' +
                '<div class="comment-meta"><strong>' +
                esc(c.author_name) +
                "</strong> &middot; " +
                c.created_at.toLocaleDateString() +
                "</div>" +
                '<div class="comment-body">' +
                esc(c.body) +
                "</div>" +
                '<div class="comment-actions">' +
                '<a onclick="startReply(' +
                c.id +
                ')">Reply</a>' +
                '<a onclick="deleteComment(' +
                c.id +
                ')">Delete</a>' +
                "</div>" +
                (replies
                  ? '<div class="replies">' + replies + "</div>"
                  : "") +
                "</div>"
              );
            }

            function esc(s) {
              const d = document.createElement("div");
              d.textContent = s;
              return d.innerHTML;
            }

            function startReply(id) {
              replyTo = id;
              document.getElementById("reply-info").style.display = "block";
              document.getElementById("reply-parent-id").textContent = "#" + id;
              document.getElementById("body").focus();
            }

            function cancelReply() {
              replyTo = null;
              document.getElementById("reply-info").style.display = "none";
            }

            async function postComment() {
              const body = document.getElementById("body").value.trim();
              if (!body) return;
              const payload = { slug: SLUG, body };
              if (replyTo) payload.parent_id = replyTo;
              const res = await fetch("/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (res.ok) {
                document.getElementById("body").value = "";
                cancelReply();
                loadComments();
              } else {
                const err = await res.json();
                alert("Error: " + err.error);
              }
            }

            async function deleteComment(id) {
              const res = await fetch("/comments/" + id, { method: "DELETE" });
              if (res.ok) {
                loadComments();
              } else {
                const err = await res.json();
                alert("Error: " + err.error);
              }
            }

            loadComments();
          </script>
        </body>
      </html>`);
  });

  return app;
}
