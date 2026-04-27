import { readFileSync } from "fs";
import { join } from "path";
import { marked } from "marked";

const FRONTMATTER_RE = /^---\n([\s\S]*?)\n---\n?/;

export interface PostExcerpt {
  title: string;
  excerptHtml: string;
  heroImage?: string;
  tags?: string[];
  date?: string;
  readMinutes?: number;
}

export function extractExcerpt(
  content: string,
  slug: string,
  wordLimit: number = 200
): PostExcerpt | null {
  const frontmatterMatch = content.match(FRONTMATTER_RE);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  const body = content.slice(frontmatterMatch[0].length).trim();

  const titleMatch = frontmatter.match(/^title:\s*['"]?(.+?)['"]?\s*$/m);
  const title = titleMatch ? titleMatch[1] : slug;

  const words = body.split(/(\s+)/);
  let wordCount = 0;
  let endIndex = words.length;
  for (let i = 0; i < words.length; i++) {
    if (!/^\s+$/.test(words[i]) && words[i] !== "") {
      wordCount++;
      if (wordCount > wordLimit) {
        endIndex = i;
        break;
      }
    }
  }
  const truncated = wordCount > wordLimit;
  const excerptMd = words.slice(0, endIndex).join("").trimEnd() + (truncated ? "..." : "");

  const excerptHtml = marked.parse(excerptMd) as string;

  const heroMatch = frontmatter.match(/^heroImage:\s*['"]?(.+?)['"]?\s*$/m);
  const heroImage = heroMatch ? heroMatch[1] : undefined;

  const dateMatch = frontmatter.match(/^date:\s*['"]?(.+?)['"]?\s*$/m);
  let date: string | undefined;
  if (dateMatch) {
    const parsed = new Date(dateMatch[1]);
    if (!isNaN(parsed.getTime())) {
      date = parsed.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    }
  }

  const tagsMatch = frontmatter.match(/^tags:\s*\[([^\]]+)\]\s*$/m);
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean)
    : undefined;

  // Rough read-time estimate: 200 words per minute over the full body
  const totalWords = body.split(/\s+/).filter(Boolean).length;
  const readMinutes = totalWords > 0 ? Math.max(1, Math.round(totalWords / 200)) : undefined;

  return { title, excerptHtml, heroImage, tags, date, readMinutes };
}

export function extractExcerptFromPost(
  contentDir: string,
  slug: string,
  wordLimit: number = 200
): PostExcerpt | null {
  let content: string;
  try {
    content = readFileSync(join(contentDir, slug + ".md"), "utf-8");
  } catch {
    return null;
  }
  return extractExcerpt(content, slug, wordLimit);
}
