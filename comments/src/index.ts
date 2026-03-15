import { serve } from "@hono/node-server";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { initDb } from "./db/index.js";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

const config = loadConfig();

// Ensure data directory exists
mkdirSync(dirname(config.databasePath), { recursive: true });

const db = initDb(config.databasePath);
const app = createApp(db, config);

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Comment server running at http://localhost:${info.port}`);
  console.log(`Test page: http://localhost:${info.port}/test`);
});
