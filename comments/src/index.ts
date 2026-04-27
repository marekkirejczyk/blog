import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

createApp(loadConfig()).run();
