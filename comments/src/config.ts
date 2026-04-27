export type NodeEnv = "production" | "development" | "test";

export interface Configuration {
  nodeEnv: NodeEnv;
  port: number;
  databasePath: string;
  corsOrigin: string | string[];
  blogUrl: string;
  oauthCallbackBase: string;
  secureCookies: boolean;
  sessionDurationDays: number;
  resendApiKey?: string;
  fromEmail: string;
  contentDir: string;
  githubClientId?: string;
  githubClientSecret?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookClientId?: string;
  facebookClientSecret?: string;
  linkedinClientId?: string;
  linkedinClientSecret?: string;
  xClientId?: string;
  xClientSecret?: string;
}

const production: Configuration = {
  nodeEnv: "production",
  port: 3001,
  databasePath: "./data/comments.db",
  corsOrigin: "https://zkmarek.com",
  blogUrl: "https://zkmarek.com",
  oauthCallbackBase: "https://comments.zkmarek.com",
  secureCookies: true,
  sessionDurationDays: 30,
  fromEmail: "blog@zkmarek.com",
  contentDir: "/var/www/blog-content",
};

const development: Configuration = {
  nodeEnv: "development",
  port: 3001,
  databasePath: "./data/comments.db",
  corsOrigin: ["http://localhost:4321", "http://localhost:4322"],
  blogUrl: "http://localhost:4321",
  oauthCallbackBase: "http://localhost:3001",
  secureCookies: false,
  sessionDurationDays: 30,
  fromEmail: "blog@zkmarek.com",
  contentDir: "../blog/src/content/blog",
};

const test: Configuration = {
  ...development,
  nodeEnv: "test",
  databasePath: ":memory:",
};

export function loadConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>
): Configuration {
  let base: Configuration;
  if (env.NODE_ENV === "production") {
    base = production;
  } else if (env.NODE_ENV === "test") {
    base = test;
  } else {
    base = development;
  }
  return {
    ...base,
    port: parseInt(env.PORT ?? String(base.port), 10),
    databasePath: env.DATABASE_PATH ?? base.databasePath,
    corsOrigin: env.CORS_ORIGIN ?? base.corsOrigin,
    blogUrl: env.BLOG_URL ?? base.blogUrl,
    oauthCallbackBase: env.OAUTH_CALLBACK_BASE ?? base.oauthCallbackBase,
    resendApiKey: env.RESEND_API_KEY,
    fromEmail: env.FROM_EMAIL ?? base.fromEmail,
    contentDir: env.CONTENT_DIR ?? base.contentDir,
    githubClientId: env.GITHUB_CLIENT_ID,
    githubClientSecret: env.GITHUB_CLIENT_SECRET,
    googleClientId: env.GOOGLE_CLIENT_ID,
    googleClientSecret: env.GOOGLE_CLIENT_SECRET,
    facebookClientId: env.FACEBOOK_CLIENT_ID,
    facebookClientSecret: env.FACEBOOK_CLIENT_SECRET,
    linkedinClientId: env.LINKEDIN_CLIENT_ID,
    linkedinClientSecret: env.LINKEDIN_CLIENT_SECRET,
    xClientId: env.X_CLIENT_ID,
    xClientSecret: env.X_CLIENT_SECRET,
  };
}
