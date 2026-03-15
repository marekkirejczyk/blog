import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  it("returns development defaults when no env is set", () => {
    const config = loadConfig({});
    expect(config).toEqual(expect.objectContaining({
      port: 3001,
      databasePath: "./data/comments.db",
      corsOrigin: "*",
      blogUrl: "http://localhost:4321",
      oauthCallbackBase: "http://localhost:3001",
      secureCookies: false,
      sessionDurationDays: 30,
    }));
  });

  it("returns production defaults when NODE_ENV is production", () => {
    const config = loadConfig({ NODE_ENV: "production" });
    expect(config).toEqual(expect.objectContaining({
      corsOrigin: "https://zkmarek.com",
      blogUrl: "https://zkmarek.com",
      oauthCallbackBase: "https://comments.zkmarek.com",
      secureCookies: true,
    }));
  });

  it("allows env overrides for static values", () => {
    const config = loadConfig({
      PORT: "4000",
      BLOG_URL: "https://custom.com",
      DATABASE_PATH: "/tmp/test.db",
      CORS_ORIGIN: "https://other.com",
      OAUTH_CALLBACK_BASE: "https://auth.custom.com",
    });
    expect(config.port).toBe(4000);
    expect(config.blogUrl).toBe("https://custom.com");
    expect(config.databasePath).toBe("/tmp/test.db");
    expect(config.corsOrigin).toBe("https://other.com");
    expect(config.oauthCallbackBase).toBe("https://auth.custom.com");
  });

  it("populates OAuth secrets from env", () => {
    const config = loadConfig({
      GITHUB_CLIENT_ID: "gh-id",
      GITHUB_CLIENT_SECRET: "gh-secret",
    });
    expect(config.githubClientId).toBe("gh-id");
    expect(config.githubClientSecret).toBe("gh-secret");
  });

  it("leaves OAuth secrets undefined when not in env", () => {
    const config = loadConfig({});
    expect(config.githubClientId).toBeUndefined();
    expect(config.googleClientId).toBeUndefined();
    expect(config.facebookClientId).toBeUndefined();
    expect(config.linkedinClientId).toBeUndefined();
    expect(config.xClientId).toBeUndefined();
  });

  it("env overrides take precedence over production defaults", () => {
    const config = loadConfig({
      NODE_ENV: "production",
      CORS_ORIGIN: "https://staging.zkmarek.com",
    });
    expect(config.corsOrigin).toBe("https://staging.zkmarek.com");
    expect(config.secureCookies).toBe(true); // still production default
  });
});
