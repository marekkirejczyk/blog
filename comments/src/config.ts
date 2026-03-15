export interface Configuration {
  port: number;
  databasePath: string;
  corsOrigin: string;
  blogUrl: string;
  oauthCallbackBase: string;
  secureCookies: boolean;
  sessionDurationDays: number;
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
  port: 3001,
  databasePath: "./data/comments.db",
  corsOrigin: "https://zkmarek.com",
  blogUrl: "https://zkmarek.com",
  oauthCallbackBase: "https://comments.zkmarek.com",
  secureCookies: true,
  sessionDurationDays: 30,
};

const development: Configuration = {
  port: 3001,
  databasePath: "./data/comments.db",
  corsOrigin: "*",
  blogUrl: "http://localhost:4321",
  oauthCallbackBase: "http://localhost:3001",
  secureCookies: false,
  sessionDurationDays: 30,
};

export function loadConfig(
  env: Record<string, string | undefined> = process.env as Record<string, string | undefined>
): Configuration {
  const base = env.NODE_ENV === "production" ? production : development;
  return {
    ...base,
    port: parseInt(env.PORT ?? String(base.port), 10),
    databasePath: env.DATABASE_PATH ?? base.databasePath,
    corsOrigin: env.CORS_ORIGIN ?? base.corsOrigin,
    blogUrl: env.BLOG_URL ?? base.blogUrl,
    oauthCallbackBase: env.OAUTH_CALLBACK_BASE ?? base.oauthCallbackBase,
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
