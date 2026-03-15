import { GitHub, Google, Facebook, LinkedIn, Twitter } from "arctic";
import type { Configuration } from "../config.js";

export type ProviderName = "github" | "google" | "facebook" | "linkedin" | "x";

export const PROVIDER_NAMES: ProviderName[] = ["github", "google", "facebook", "linkedin", "x"];

interface ProviderConfig {
  clientIdKey: keyof Configuration;
  clientSecretKey: keyof Configuration;
  factory: (clientId: string, clientSecret: string, redirectURI: string) => object;
  scopes: string[];
  usesPKCE: boolean;
}

const PROVIDER_CONFIGS: Record<ProviderName, ProviderConfig> = {
  github: {
    clientIdKey: "githubClientId",
    clientSecretKey: "githubClientSecret",
    factory: (id, secret, uri) => new GitHub(id, secret, uri),
    scopes: ["user:email"],
    usesPKCE: false,
  },
  google: {
    clientIdKey: "googleClientId",
    clientSecretKey: "googleClientSecret",
    factory: (id, secret, uri) => new Google(id, secret, uri),
    scopes: ["openid", "email", "profile"],
    usesPKCE: true,
  },
  facebook: {
    clientIdKey: "facebookClientId",
    clientSecretKey: "facebookClientSecret",
    factory: (id, secret, uri) => new Facebook(id, secret, uri),
    scopes: ["email", "public_profile"],
    usesPKCE: false,
  },
  linkedin: {
    clientIdKey: "linkedinClientId",
    clientSecretKey: "linkedinClientSecret",
    factory: (id, secret, uri) => new LinkedIn(id, secret, uri),
    scopes: ["openid", "email", "profile"],
    usesPKCE: false,
  },
  x: {
    clientIdKey: "xClientId",
    clientSecretKey: "xClientSecret",
    factory: (id, secret, uri) => new Twitter(id, secret, uri),
    scopes: ["tweet.read", "users.read"],
    usesPKCE: true,
  },
};

export interface ProviderInstance {
  provider: object;
  scopes: string[];
  usesPKCE: boolean;
}

export function createProviders(
  config: Configuration
): Map<ProviderName, ProviderInstance> {
  const providers = new Map<ProviderName, ProviderInstance>();

  for (const [name, providerConfig] of Object.entries(PROVIDER_CONFIGS)) {
    const clientId = config[providerConfig.clientIdKey] as string | undefined;
    const clientSecret = config[providerConfig.clientSecretKey] as string | undefined;
    if (!clientId || !clientSecret) continue;

    const redirectURI = `${config.oauthCallbackBase}/auth/${name}/callback`;
    providers.set(name as ProviderName, {
      provider: providerConfig.factory(clientId, clientSecret, redirectURI),
      scopes: providerConfig.scopes,
      usesPKCE: providerConfig.usesPKCE,
    });
  }

  return providers;
}
