import type { Context } from "hono";
import type Database from "better-sqlite3";

export interface UserContext {
  id: number;
  name: string;
  avatar_url: string | null;
  is_admin: boolean;
}

export type AppEnv = {
  Variables: {
    db: Database.Database;
    user?: UserContext;
  };
};

export type RouteContext = Context<AppEnv>;
