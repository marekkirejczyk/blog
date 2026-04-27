import { describe, it, expect, beforeEach } from "vitest";
import { extractExcerpt, extractExcerptFromPost } from "../../src/email/excerpt.js";
import { mkdtempSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("extractExcerpt", () => {
  it("parses title, body, heroImage, tags, date, and read time", () => {
    const content = `---
title: My Great Post
date: 2026-01-01T12:00:00Z
heroImage: "/img/hero.png"
tags: [rust, "web-dev", performance]
---

This is the **first** paragraph of my blog post.`;

    expect(extractExcerpt(content, "my-post")).toEqual({
      title: "My Great Post",
      excerptHtml: "<p>This is the <strong>first</strong> paragraph of my blog post.</p>\n",
      heroImage: "/img/hero.png",
      tags: ["rust", "web-dev", "performance"],
      date: "Jan 01, 2026",
      readMinutes: 1,
    });
  });

  it("truncates at word limit and adds ellipsis", () => {
    const words = Array.from({ length: 300 }, (_, i) => `word${i}`).join(" ");
    const content = `---\ntitle: Long Post\n---\n\n${words}`;

    expect(extractExcerpt(content, "long-post", 10)).toEqual({
      title: "Long Post",
      excerptHtml:
        "<p>word0 word1 word2 word3 word4 word5 word6 word7 word8 word9...</p>\n",
      heroImage: undefined,
      tags: undefined,
      date: undefined,
      readMinutes: 2,
    });
  });

  it("returns null when frontmatter is missing", () => {
    expect(extractExcerpt("Just plain text", "no-frontmatter")).toBeNull();
  });

  it("strips quotes around the title", () => {
    const content = `---\ntitle: "A Quoted Title"\n---\n\nSome content.`;

    expect(extractExcerpt(content, "quoted")).toEqual({
      title: "A Quoted Title",
      excerptHtml: "<p>Some content.</p>\n",
      heroImage: undefined,
      tags: undefined,
      date: undefined,
      readMinutes: 1,
    });
  });

  it("falls back to the slug when title is absent", () => {
    const content = `---\nheroImage: "/img/h.png"\n---\n\nHello world.`;

    expect(extractExcerpt(content, "fallback-slug")).toEqual({
      title: "fallback-slug",
      excerptHtml: "<p>Hello world.</p>\n",
      heroImage: "/img/h.png",
      tags: undefined,
      date: undefined,
      readMinutes: 1,
    });
  });
});

describe("extractExcerptFromPost", () => {
  let contentDir: string;

  beforeEach(() => {
    contentDir = mkdtempSync(join(tmpdir(), "excerpt-test-"));
  });

  it("reads the markdown file and delegates to extractExcerpt", () => {
    writeFileSync(
      join(contentDir, "my-post.md"),
      `---\ntitle: My Great Post\ndate: 2026-01-01T12:00:00Z\n---\n\nHello world.`
    );

    expect(extractExcerptFromPost(contentDir, "my-post")).toEqual({
      title: "My Great Post",
      excerptHtml: "<p>Hello world.</p>\n",
      heroImage: undefined,
      tags: undefined,
      date: "Jan 01, 2026",
      readMinutes: 1,
    });
  });

  it("returns null for a non-existent file", () => {
    expect(extractExcerptFromPost(contentDir, "does-not-exist")).toBeNull();
  });
});
