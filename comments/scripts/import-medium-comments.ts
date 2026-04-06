import { readdirSync } from "fs";
import { join, basename } from "path";
import { initDb } from "../src/db/init.js";
import { upsertUser } from "../src/db/users.js";
import {
  createImportedComment,
  findImportedComment,
} from "../src/db/comments.js";
import { formatDate } from "../src/utils/dates.js";

// ── Config ──────────────────────────────────────────────────────────────────

const IMPORT_DIR = join(import.meta.dirname, "..", "..", "blog", "import");
const DB_PATH = join(import.meta.dirname, "..", "data", "comments.db");
const MAREK_MEDIUM_ID = "1ad34b4ecc2e";
const DELAY_MS = 5000;
const MAX_RETRIES = 5;

// ── Types ───────────────────────────────────────────────────────────────────

interface MediumParagraph {
  type: number;
  text: string;
  markups?: { type: number; start: number; end: number; href?: string }[];
}

interface MediumResponse {
  postId: string;
  creatorId: string;
  createdAt: number;
  inResponseToPostId: string;
  paragraphs: MediumParagraph[];
  userName: string;
  userImageId: string;
  userUsername: string;
}

// ── Medium API ──────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchMediumJson(url: string): Promise<any> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await sleep(DELAY_MS * (attempt + 1));
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const wait = DELAY_MS * Math.pow(2, attempt + 1);
      console.log(`  Rate limited, waiting ${wait / 1000}s before retry...`);
      await sleep(wait);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    const text = await response.text();
    const json = text.replace(/^\]\)\}while\(1\);<\/x>/, "");
    return JSON.parse(json);
  }
}

async function fetchResponses(postId: string): Promise<string[]> {
  try {
    const data = await fetchMediumJson(
      `https://medium.com/_/api/posts/${postId}/responses`
    );
    const posts = data?.payload?.value;
    if (!Array.isArray(posts)) return [];
    return posts.map((p: any) => p.id as string);
  } catch (e) {
    console.error(`  Failed to fetch responses for ${postId}:`, e);
    return [];
  }
}

async function fetchPostData(
  postId: string
): Promise<MediumResponse | null> {
  try {
    const data = await fetchMediumJson(
      `https://medium.com/p/${postId}?format=json`
    );
    const post = data?.payload?.value;
    if (!post) return null;

    const creatorId = post.creatorId;
    const users = data?.payload?.references?.User ?? {};
    const user = users[creatorId] ?? {};

    return {
      postId: post.id,
      creatorId,
      createdAt: post.createdAt,
      inResponseToPostId: post.inResponseToPostId ?? null,
      paragraphs: post.content?.bodyModel?.paragraphs ?? [],
      userName: user.name ?? "Unknown",
      userImageId: user.imageId ?? "",
      userUsername: user.username ?? "",
    };
  } catch (e) {
    console.error(`  Failed to fetch post ${postId}:`, e);
    return null;
  }
}

// ── Paragraph → Text ────────────────────────────────────────────────────────

function applyMarkups(text: string, markups: MediumParagraph["markups"]): string {
  if (!markups?.length) return text;
  // Apply in reverse order to preserve offsets
  const sorted = [...markups].sort((a, b) => b.start - a.start);
  let result = text;
  for (const m of sorted) {
    const before = result.slice(0, m.start);
    const marked = result.slice(m.start, m.end);
    const after = result.slice(m.end);
    if (m.type === 1) result = `${before}**${marked}**${after}`;
    else if (m.type === 2) result = `${before}*${marked}*${after}`;
    else if (m.type === 3 && m.href) result = `${before}[${marked}](${m.href})${after}`;
  }
  return result;
}

function paragraphsToText(paragraphs: MediumParagraph[]): string {
  return paragraphs
    .map((p) => {
      const text = applyMarkups(p.text || "", p.markups);
      switch (p.type) {
        case 6: return `> ${text}`;
        case 8:
        case 11: return `\`\`\`\n${text}\n\`\`\``;
        case 9: return `- ${text}`;
        case 10: return `1. ${text}`;
        default: return text;
      }
    })
    .filter((t) => t.length > 0)
    .join("\n\n");
}

// ── Slug generation (matches convert-posts.js) ─────────────────────────────

function generateSlug(filename: string): string {
  let slug = basename(filename, ".html");
  slug = slug.replace(/^\d{4}-\d{2}-\d{2}_/, "");
  slug = slug.replace(/-[a-f0-9]{8,}$/, "");
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug;
}

function isComment(filename: string): boolean {
  // Same heuristic-based filenames as convert-posts.js comment patterns
  const commentPatterns = [
    /^[\d-]+_(In-general|Ok-now|Oh-I-am|So-both|Well-actually|Yes--|Currently|We-plan|The-interesting|Great-article|Great-question|Maurelian|Post-is-too-long|I-am-writing-series)/i,
  ];
  return commentPatterns.some((p) => p.test(filename));
}

// Articles known to have comments (verified via Medium API during research)
const ARTICLES_WITH_COMMENTS: Record<string, string> = {
  "3469fc2e9b22": "hype-driven-development",
  "a8837b9cedf7": "performance-of-basic-ruby-types",
  "8e630e5e9e91": "introducing-waffle",
  "b4781db2a383": "formal-verification-for-n00bs-part-1",
  "74085f5cd6c1": "formal-verification-for-n00bs-part-2-proving-the-correctness-of-a-token",
  "8e8d13318086": "formal-verification-for-n00bs-part-3-an-attempt-to-prevent-classic-hack-with-klab",
  "55813b22ebf2": "mocking-solidity-smart-contracts-with-waffle",
  "d529554947c4": "running-a-dev-shop-part-1-myths-and-favorable-facts",
  "7a0bcf97b58": "running-a-dev-shop-part-2-bootstrapping-and-specialization",
  "458f4a64bc": "running-a-dev-shop-part-3-talent-pipeline-and-employee-life-cycle",
  "194b917184f6": "running-a-dev-shop-part-5-growth-and-structure",
  "a4dce5013729": "five-reasons-why-i-change-my-focus-to-cryptography",
  "9fa272c2fcd6": "learning-ai-coding-is-no-longer-optional-but-it-s-not-vibe-coding",
};

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Medium Comments Import ===\n");

  // Use both the known articles and the full hash->slug mapping from import dir
  const files = readdirSync(IMPORT_DIR).filter((f) => f.endsWith(".html"));
  const hashToSlug: Record<string, string> = { ...ARTICLES_WITH_COMMENTS };
  const slugSet = new Set<string>(Object.values(ARTICLES_WITH_COMMENTS));

  for (const file of files) {
    if (isComment(file)) continue;
    const hashMatch = file.match(/-([a-f0-9]{8,})\.html$/);
    if (!hashMatch) continue;
    const hash = hashMatch[1];
    if (hashToSlug[hash]) continue; // already have it
    let slug = generateSlug(file);
    if (slugSet.has(slug)) {
      const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) slug = `${slug}-${dateMatch[1]}`;
    }
    slugSet.add(slug);
    hashToSlug[hash] = slug;
  }

  console.log(`Checking ${Object.keys(ARTICLES_WITH_COMMENTS).length} articles with known comments.\n`);

  // Open database
  const db = initDb(DB_PATH);

  // Collect all responses across all articles
  const allResponses: MediumResponse[] = [];
  const articleForResponse = new Map<string, string>(); // mediumPostId -> articleHash
  let totalArticlesWithComments = 0;

  for (const [articleHash, slug] of Object.entries(ARTICLES_WITH_COMMENTS)) {
    process.stdout.write(`Checking ${slug}... `);
    const responseIds = await fetchResponses(articleHash);

    if (responseIds.length === 0) {
      console.log("0 responses");
      continue;
    }

    console.log(`${responseIds.length} responses`);
    totalArticlesWithComments++;

    // Fetch each response and recursively fetch sub-responses
    const queue = [...responseIds];
    const seen = new Set<string>();

    while (queue.length > 0) {
      const responseId = queue.shift()!;
      if (seen.has(responseId)) continue;
      seen.add(responseId);

      const postData = await fetchPostData(responseId);
      if (!postData) continue;

      allResponses.push(postData);
      articleForResponse.set(postData.postId, articleHash);

      // Check for sub-responses (replies to replies)
      const subResponseIds = await fetchResponses(responseId);
      for (const subId of subResponseIds) {
        if (!seen.has(subId)) {
          queue.push(subId);
        }
      }
    }
  }

  console.log(`\nFound ${allResponses.length} total comments across ${totalArticlesWithComments} articles.\n`);

  // Sort by creation time (parents before children)
  allResponses.sort((a, b) => a.createdAt - b.createdAt);

  // Create users and insert comments
  const mediumPostToCommentId = new Map<string, number>();
  let imported = 0;
  let skipped = 0;

  for (const response of allResponses) {
    // Resolve the article slug for this response
    // Walk up the inResponseToPostId chain to find the root article
    let articleHash = hashToSlug[response.inResponseToPostId]
      ? response.inResponseToPostId
      : undefined;

    if (!articleHash) {
      // The parent is another response - find which article it belongs to
      // Check if inResponseToPostId is a known response
      for (const other of allResponses) {
        if (other.postId === response.inResponseToPostId) {
          articleHash = articleForResponse.get(other.postId);
          break;
        }
      }
    }

    // Also check if this response itself was mapped to an article
    if (!articleHash) {
      articleHash = articleForResponse.get(response.postId);
    }

    if (!articleHash) {
      console.log(`  SKIP: Cannot resolve article for response ${response.postId}`);
      skipped++;
      continue;
    }

    const slug = hashToSlug[articleHash];
    if (!slug) {
      console.log(`  SKIP: No slug for article ${articleHash}`);
      skipped++;
      continue;
    }

    // Create user
    const avatarUrl = response.userImageId
      ? `https://miro.medium.com/v2/resize:fill:176:176/${response.userImageId}`
      : null;
    const profileUrl = response.userUsername
      ? `https://medium.com/@${response.userUsername}`
      : null;

    const user = upsertUser(
      db,
      "medium",
      response.creatorId,
      response.userName,
      null,
      avatarUrl,
      profileUrl
    );

    // Mark Marek as admin
    if (response.creatorId === MAREK_MEDIUM_ID) {
      db.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(user.id);
    }

    // Convert body
    const body = paragraphsToText(response.paragraphs);
    if (!body) {
      console.log(`  SKIP: Empty body for response ${response.postId}`);
      skipped++;
      continue;
    }

    // Format timestamp
    const createdAt = formatDate(new Date(response.createdAt));

    // Resolve parent_id
    let parentId: number | undefined;
    if (response.inResponseToPostId !== articleHash) {
      // This is a reply to another response
      parentId = mediumPostToCommentId.get(response.inResponseToPostId);
      if (!parentId) {
        // Parent might not have been imported (e.g., deleted) - make it top-level
        console.log(`  WARN: Parent ${response.inResponseToPostId} not found for ${response.postId}, making top-level`);
      }
    }

    // Idempotency check
    const existing = findImportedComment(db, slug, user.id, createdAt, body);
    if (existing) {
      mediumPostToCommentId.set(response.postId, existing.id);
      skipped++;
      continue;
    }

    // Insert comment
    const comment = createImportedComment(db, slug, user.id, body, createdAt, parentId);
    mediumPostToCommentId.set(response.postId, comment.id);
    imported++;

    console.log(`  OK: [${slug}] ${response.userName}: "${body.slice(0, 60)}..."`);
  }

  console.log(`\n=== Done! Imported: ${imported}, Skipped: ${skipped} ===`);

  // Summary per article
  console.log("\nComments per article:");
  const countBySlug = new Map<string, number>();
  for (const response of allResponses) {
    const articleHash = articleForResponse.get(response.postId);
    if (!articleHash) continue;
    const slug = hashToSlug[articleHash];
    if (!slug) continue;
    countBySlug.set(slug, (countBySlug.get(slug) ?? 0) + 1);
  }
  for (const [slug, count] of [...countBySlug.entries()].sort()) {
    console.log(`  ${slug}: ${count}`);
  }

  db.close();
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
