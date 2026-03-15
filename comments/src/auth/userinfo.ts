import type { ProviderName } from "./providers.js";

export interface UserInfo {
  providerId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

async function fetchJson(url: string, accessToken: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.json();
}

async function fetchGitHubUserInfo(accessToken: string): Promise<UserInfo> {
  const profile = (await fetchJson("https://api.github.com/user", accessToken)) as {
    id: number;
    name: string | null;
    login: string;
    email: string | null;
    avatar_url: string;
  };

  let email = profile.email;
  if (!email) {
    const emails = (await fetchJson("https://api.github.com/user/emails", accessToken)) as {
      email: string;
      primary: boolean;
    }[];
    email = emails.find((e) => e.primary)?.email ?? emails[0]?.email ?? null;
  }

  return {
    providerId: String(profile.id),
    name: profile.name ?? profile.login,
    email,
    avatarUrl: profile.avatar_url,
  };
}

async function fetchGoogleUserInfo(accessToken: string): Promise<UserInfo> {
  const profile = (await fetchJson(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    accessToken
  )) as {
    sub: string;
    name: string;
    email: string;
    picture: string;
  };

  return {
    providerId: profile.sub,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.picture,
  };
}

async function fetchFacebookUserInfo(accessToken: string): Promise<UserInfo> {
  const profile = (await fetchJson(
    "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)",
    accessToken
  )) as {
    id: string;
    name: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };

  return {
    providerId: profile.id,
    name: profile.name,
    email: profile.email ?? null,
    avatarUrl: profile.picture?.data?.url ?? null,
  };
}

async function fetchLinkedInUserInfo(accessToken: string): Promise<UserInfo> {
  const profile = (await fetchJson(
    "https://api.linkedin.com/v2/userinfo",
    accessToken
  )) as {
    sub: string;
    name: string;
    email: string;
    picture: string;
  };

  return {
    providerId: profile.sub,
    name: profile.name,
    email: profile.email,
    avatarUrl: profile.picture,
  };
}

async function fetchXUserInfo(accessToken: string): Promise<UserInfo> {
  const response = (await fetchJson(
    "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
    accessToken
  )) as {
    data: {
      id: string;
      name: string;
      username: string;
      profile_image_url?: string;
    };
  };

  return {
    providerId: response.data.id,
    name: response.data.name,
    email: null, // X does not provide email via standard OAuth
    avatarUrl: response.data.profile_image_url ?? null,
  };
}

const FETCHERS: Record<ProviderName, (accessToken: string) => Promise<UserInfo>> = {
  github: fetchGitHubUserInfo,
  google: fetchGoogleUserInfo,
  facebook: fetchFacebookUserInfo,
  linkedin: fetchLinkedInUserInfo,
  x: fetchXUserInfo,
};

export function fetchUserInfo(provider: ProviderName, accessToken: string): Promise<UserInfo> {
  return FETCHERS[provider](accessToken);
}
