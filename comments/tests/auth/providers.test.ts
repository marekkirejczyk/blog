import { describe, it, expect } from "vitest";
import { createProviders } from "../../src/auth/providers.js";
import { loadConfig } from "../../src/config.js";

function configWith(env: Record<string, string>) {
  return loadConfig(env);
}

describe("createProviders", () => {
  it("returns empty map when no OAuth secrets are set", () => {
    const providers = createProviders(configWith({}));
    expect(providers.size).toBe(0);
  });

  it("creates GitHub provider when env vars are present", () => {
    const providers = createProviders(configWith({
      GITHUB_CLIENT_ID: "gh-id",
      GITHUB_CLIENT_SECRET: "gh-secret",
    }));
    expect(providers.size).toBe(1);
    expect(providers.has("github")).toBe(true);
    expect(providers.get("github")!.usesPKCE).toBe(false);
    expect(providers.get("github")!.scopes).toContain("user:email");
  });

  it("creates Google provider with PKCE", () => {
    const providers = createProviders(configWith({
      GOOGLE_CLIENT_ID: "g-id",
      GOOGLE_CLIENT_SECRET: "g-secret",
    }));
    expect(providers.has("google")).toBe(true);
    expect(providers.get("google")!.usesPKCE).toBe(true);
  });

  it("skips providers with missing client secret", () => {
    const providers = createProviders(configWith({
      GITHUB_CLIENT_ID: "gh-id",
      // No GITHUB_CLIENT_SECRET
    }));
    expect(providers.size).toBe(0);
  });

  it("creates multiple providers when configured", () => {
    const providers = createProviders(configWith({
      GITHUB_CLIENT_ID: "gh-id",
      GITHUB_CLIENT_SECRET: "gh-secret",
      GOOGLE_CLIENT_ID: "g-id",
      GOOGLE_CLIENT_SECRET: "g-secret",
      LINKEDIN_CLIENT_ID: "li-id",
      LINKEDIN_CLIENT_SECRET: "li-secret",
    }));
    expect(providers.size).toBe(3);
    expect(Array.from(providers.keys()).sort()).toEqual(["github", "google", "linkedin"]);
  });

  it("creates X provider with PKCE", () => {
    const providers = createProviders(configWith({
      X_CLIENT_ID: "x-id",
      X_CLIENT_SECRET: "x-secret",
    }));
    expect(providers.has("x")).toBe(true);
    expect(providers.get("x")!.usesPKCE).toBe(true);
  });
});
