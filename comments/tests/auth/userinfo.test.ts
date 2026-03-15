import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchUserInfo } from "../../src/auth/userinfo.js";

function mockFetch(...responses: object[]) {
  let callIndex = 0;
  vi.stubGlobal("fetch", vi.fn(() => {
    const body = responses[callIndex++] ?? responses[responses.length - 1];
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    });
  }));
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("fetchUserInfo", () => {
  it("parses GitHub profile (with email from profile)", async () => {
    mockFetch({
      id: 12345,
      name: "Alice",
      login: "alice",
      email: "alice@github.com",
      avatar_url: "https://avatars.githubusercontent.com/u/12345",
    });

    const info = await fetchUserInfo("github", "fake-token");
    expect(info).toEqual({
      providerId: "12345",
      name: "Alice",
      email: "alice@github.com",
      avatarUrl: "https://avatars.githubusercontent.com/u/12345",
    });
  });

  it("parses GitHub profile (fallback to emails endpoint)", async () => {
    mockFetch(
      { id: 12345, name: null, login: "alice", email: null, avatar_url: "https://avatar.url" },
      [{ email: "primary@github.com", primary: true }, { email: "secondary@github.com", primary: false }]
    );

    const info = await fetchUserInfo("github", "fake-token");
    expect(info).toEqual({
      providerId: "12345",
      name: "alice", // falls back to login when name is null
      email: "primary@github.com",
      avatarUrl: "https://avatar.url",
    });
  });

  it("parses Google profile", async () => {
    mockFetch({
      sub: "google-456",
      name: "Bob Smith",
      email: "bob@gmail.com",
      picture: "https://lh3.googleusercontent.com/photo",
    });

    const info = await fetchUserInfo("google", "fake-token");
    expect(info).toEqual({
      providerId: "google-456",
      name: "Bob Smith",
      email: "bob@gmail.com",
      avatarUrl: "https://lh3.googleusercontent.com/photo",
    });
  });

  it("parses Facebook profile", async () => {
    mockFetch({
      id: "fb-789",
      name: "Carol",
      email: "carol@facebook.com",
      picture: { data: { url: "https://graph.facebook.com/photo" } },
    });

    const info = await fetchUserInfo("facebook", "fake-token");
    expect(info).toEqual({
      providerId: "fb-789",
      name: "Carol",
      email: "carol@facebook.com",
      avatarUrl: "https://graph.facebook.com/photo",
    });
  });

  it("parses Facebook profile without email or picture", async () => {
    mockFetch({ id: "fb-789", name: "Carol" });

    const info = await fetchUserInfo("facebook", "fake-token");
    expect(info).toEqual({
      providerId: "fb-789",
      name: "Carol",
      email: null,
      avatarUrl: null,
    });
  });

  it("parses LinkedIn profile", async () => {
    mockFetch({
      sub: "li-abc",
      name: "Dave",
      email: "dave@linkedin.com",
      picture: "https://media.licdn.com/photo",
    });

    const info = await fetchUserInfo("linkedin", "fake-token");
    expect(info).toEqual({
      providerId: "li-abc",
      name: "Dave",
      email: "dave@linkedin.com",
      avatarUrl: "https://media.licdn.com/photo",
    });
  });

  it("parses X (Twitter) profile", async () => {
    mockFetch({
      data: {
        id: "x-999",
        name: "Eve",
        username: "eve_x",
        profile_image_url: "https://pbs.twimg.com/photo",
      },
    });

    const info = await fetchUserInfo("x", "fake-token");
    expect(info).toEqual({
      providerId: "x-999",
      name: "Eve",
      email: null, // X does not provide email
      avatarUrl: "https://pbs.twimg.com/photo",
    });
  });

  it("throws on failed fetch", async () => {
    vi.stubGlobal("fetch", vi.fn(() =>
      Promise.resolve({ ok: false, status: 401 })
    ));

    await expect(fetchUserInfo("github", "bad-token")).rejects.toThrow("401");
  });
});
