import { serve } from "@hono/node-server";
import { initDb, upsertUser } from "./db.js";
import { createApp } from "./app.js";

const DATABASE_PATH = process.env.DATABASE_PATH ?? "./data/comments.db";
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// Ensure data directory exists
import { mkdirSync } from "fs";
import { dirname } from "path";
mkdirSync(dirname(DATABASE_PATH), { recursive: true });

const db = initDb(DATABASE_PATH);

// In dev mode, auto-create a test user so the test page works without OAuth
const testUser = upsertUser(db, "test", "1", "Test User", null, null);

const app = createApp(db, {
  corsOrigin: "*", // permissive in dev
  authMiddleware: async (c, next) => {
    // Stub: auto-authenticate as test user in dev
    c.set("user", {
      id: testUser.id,
      name: testUser.name,
      avatar_url: testUser.avatar_url,
      is_admin: false,
    });
    await next();
  },
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Comment server running at http://localhost:${info.port}`);
  console.log(`Test page: http://localhost:${info.port}/test`);
});
