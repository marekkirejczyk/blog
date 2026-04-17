#!/usr/bin/env node
// Merge a slug -> [tags] JSON mapping into the frontmatter of each post.
// Usage: node blog/scripts/apply-tags.js <path-to-tags.json>

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const tagsPath = process.argv[2];
if (!tagsPath) {
  console.error('Usage: node apply-tags.js <tags.json>');
  process.exit(1);
}

const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content', 'blog');
const tags = JSON.parse(readFileSync(tagsPath, 'utf8'));

function yamlList(items) {
  return '[' + items.map((t) => JSON.stringify(t)).join(', ') + ']';
}

function upsertTags(frontmatter, list) {
  if (/^tags:.*$/m.test(frontmatter)) {
    return frontmatter.replace(/^tags:.*$/m, `tags: ${yamlList(list)}`);
  }
  // Insert before closing ---
  return frontmatter.replace(/(\n)(---\s*)$/, `\ntags: ${yamlList(list)}\n$2`);
}

let updated = 0, skipped = 0, missing = 0;
for (const file of readdirSync(CONTENT_DIR)) {
  if (!file.endsWith('.md')) continue;
  const slug = file.replace(/\.md$/, '');
  const list = tags[slug];
  if (!Array.isArray(list) || list.length === 0) {
    console.log(`SKIP ${slug} (no tags in mapping)`);
    if (list === undefined) missing++; else skipped++;
    continue;
  }
  const path = join(CONTENT_DIR, file);
  const content = readFileSync(path, 'utf8');
  const match = content.match(/^(---\s*\n[\s\S]*?\n---\s*)(\n[\s\S]*)$/);
  if (!match) {
    console.error(`MALFORMED ${slug} — no frontmatter block`);
    continue;
  }
  const [, fm, rest] = match;
  const newFm = upsertTags(fm, list);
  if (newFm === fm) {
    skipped++;
    continue;
  }
  writeFileSync(path, newFm + rest);
  updated++;
  console.log(`OK   ${slug}: ${JSON.stringify(list)}`);
}
console.log(`\nUpdated: ${updated}, skipped (empty/same): ${skipped}, missing from mapping: ${missing}`);
