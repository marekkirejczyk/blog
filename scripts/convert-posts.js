import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import TurndownService from 'turndown';

const IMPORT_DIR = join(import.meta.dirname, '..', 'import');
const OUTPUT_DIR = join(import.meta.dirname, '..', 'src', 'content', 'blog');

// ── Turndown setup ──────────────────────────────────────────────────────────

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  hr: '---',
});

// Keep iframes (YouTube embeds, SlideShare, etc.) as raw HTML
turndown.addRule('iframe', {
  filter: 'iframe',
  replacement: (_content, node) => {
    const src = node.getAttribute('src') || '';
    if (src.includes('youtube.com')) {
      const match = src.match(/embed\/([^?]+)/);
      if (match) return `\n\n<iframe src="https://www.youtube.com/embed/${match[1]}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>\n\n`;
    }
    if (src.includes('slideshare.net')) {
      return `\n\n<iframe src="${src}" width="100%" height="500" frameborder="0" scrolling="no"></iframe>\n\n`;
    }
    return `\n\n<iframe src="${src}" width="100%" height="400" frameborder="0"></iframe>\n\n`;
  },
});

// Handle bare <pre> tags (Medium doesn't wrap code in <code>)
turndown.addRule('mediumPre', {
  filter: (node) => node.nodeName === 'PRE' && !node.querySelector('code'),
  replacement: (_content, node) => {
    const code = node.textContent.trim()
      .replace(/\u201C|\u201D/g, '"')  // smart double quotes → straight
      .replace(/\u2018|\u2019/g, "'")  // smart single quotes → straight
      .replace(/\u0060/g, '`');        // backtick variants → straight
    return `\n\n\`\`\`js\n${code}\n\`\`\`\n\n`;
  },
});

// Strip Medium's drop cap spans
turndown.addRule('dropCap', {
  filter: (node) => node.nodeName === 'SPAN' && node.classList.contains('graf-dropCap'),
  replacement: (content) => content,
});

// Convert figure/figcaption properly
turndown.addRule('figure', {
  filter: 'figure',
  replacement: (_content, node) => {
    const img = node.querySelector('img');
    if (!img) return '';
    const src = img.getAttribute('src') || '';
    const alt = img.getAttribute('alt') || '';
    const caption = node.querySelector('figcaption');
    const captionText = caption ? caption.textContent.trim() : '';
    if (captionText && !captionText.startsWith('http')) {
      return `\n\n![${alt || captionText}](${src})\n*${captionText}*\n\n`;
    }
    return `\n\n![${alt}](${src})\n\n`;
  },
});

// ── HTML parsing helpers (no external DOM dependency) ───────────────────────

function extractBetween(html, startMarker, endMarker) {
  const startIdx = html.indexOf(startMarker);
  if (startIdx === -1) return '';
  const contentStart = startIdx + startMarker.length;
  const endIdx = html.indexOf(endMarker, contentStart);
  if (endIdx === -1) return '';
  return html.slice(contentStart, endIdx);
}

function extractTitle(html) {
  const match = html.match(/<h1 class="p-name">(.*?)<\/h1>/s);
  return match ? match[1].replace(/<[^>]*>/g, '').trim() : '';
}

function extractSubtitle(html) {
  const match = html.match(/<section data-field="subtitle"[^>]*>(.*?)<\/section>/s);
  if (!match) return '';
  return match[1].replace(/<[^>]*>/g, '').trim();
}

function extractDate(html) {
  const match = html.match(/datetime="(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

function extractBody(html) {
  const match = html.match(/<section data-field="body"[^>]*>([\s\S]*?)<\/section>\s*<footer>/);
  if (!match) return '';
  let body = match[1];

  // Remove the repeated title (graf--title) at the top of body
  body = body.replace(/<h3[^>]*class="[^"]*graf--title[^"]*"[^>]*>[\s\S]*?<\/h3>/, '');
  // Remove subtitle in body
  body = body.replace(/<h4[^>]*class="[^"]*graf--subtitle[^"]*"[^>]*>[\s\S]*?<\/h4>/, '');
  // Remove section dividers
  body = body.replace(/<div class="section-divider">.*?<\/div>/g, '');

  return body;
}

function extractHeroImage(html) {
  // Look for data-is-featured="true" first
  const featuredMatch = html.match(/<img[^>]*data-is-featured="true"[^>]*src="([^"]+)"/);
  if (featuredMatch) return featuredMatch[1];

  // Otherwise take the first image in the body
  const bodyMatch = html.match(/<section data-field="body"[\s\S]*?<img[^>]*src="([^"]+)"/);
  return bodyMatch ? bodyMatch[1] : '';
}

function countParagraphs(html) {
  const body = extractBody(html);
  const paragraphs = body.match(/<p [^>]*class="graf graf--p[^"]*"[^>]*>/g);
  return paragraphs ? paragraphs.length : 0;
}

function isComment(html, filename) {
  const title = extractTitle(html);
  const paragraphs = countParagraphs(html);
  const body = extractBody(html);
  const headings = body.match(/<h[23][^>]*>/g);
  const hasHeadings = headings && headings.length > 0;

  // Comment-like title patterns (conversational, reply-style)
  const commentPatterns = [
    /^(In general|Ok now|Oh I am|So both|Well actually|Yes,|Currently|We plan|The interesting|Great article|Great question|Maurelian|Post is too long|I am writing series)/i,
  ];
  if (commentPatterns.some((p) => p.test(title))) return true;

  // Short posts without headings are likely comments
  if (paragraphs <= 5 && !hasHeadings) return true;

  return false;
}

function generateSlug(filename) {
  // Input: "2016-11-23_Hype-Driven-Development-3469fc2e9b22.html"
  // Output: "hype-driven-development"
  let slug = basename(filename, '.html');

  // Remove date prefix (YYYY-MM-DD_)
  slug = slug.replace(/^\d{4}-\d{2}-\d{2}_/, '');

  // Remove Medium hash suffix (last -<hex> chunk)
  slug = slug.replace(/-[a-f0-9]{8,}$/, '');

  // Clean up
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')  // non-alphanumeric to dashes
    .replace(/-+/g, '-')           // collapse multiple dashes
    .replace(/^-|-$/g, '');        // trim leading/trailing dashes

  return slug;
}

function escapeYaml(str) {
  if (!str) return '';
  // Escape quotes and wrap in quotes if contains special chars
  if (str.includes('"') || str.includes(':') || str.includes('#') || str.includes("'")) {
    return `"${str.replace(/"/g, '\\"')}"`;
  }
  return `"${str}"`;
}

// ── Main ────────────────────────────────────────────────────────────────────

// Ensure output directory exists
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const files = readdirSync(IMPORT_DIR).filter((f) => f.endsWith('.html'));
let imported = 0;
let skipped = 0;
const slugs = new Set();

// Build a mapping from Medium URL hashes to local slugs
// Medium URLs end with a hash like: /some-post-title-3469fc2e9b22
const mediumHashToSlug = {};
for (const file of files) {
  const hashMatch = file.match(/-([a-f0-9]{8,})\.html$/);
  if (hashMatch) {
    const hash = hashMatch[1];
    const slug = generateSlug(file);
    mediumHashToSlug[hash] = slug;
  }
}

function rewriteMediumLinks(markdown) {
  // Match Medium URLs: https://medium.com/<anything>/<slug>-<hash>
  return markdown
    .replace(
      /https?:\/\/medium\.com\/[^)"\s]*?-([a-f0-9]{8,})(?=[)"\s])/g,
      (fullUrl, hash) => {
        const localSlug = mediumHashToSlug[hash];
        if (localSlug) {
          return `/blog/${localSlug}`;
        }
        return fullUrl; // keep external Medium links unchanged
      }
    )
    // Also handle short Medium URLs: https://medium.com/p/<hash>
    .replace(
      /https?:\/\/medium\.com\/p\/([a-f0-9]{8,})(?=[)"\s])/g,
      (fullUrl, hash) => {
        const localSlug = mediumHashToSlug[hash];
        if (localSlug) {
          return `/blog/${localSlug}`;
        }
        return fullUrl;
      }
    );
}

for (const file of files) {
  const filepath = join(IMPORT_DIR, file);
  const html = readFileSync(filepath, 'utf-8');

  // Skip comments/replies
  if (isComment(html, file)) {
    console.log(`  SKIP (comment): ${file}`);
    skipped++;
    continue;
  }

  const title = extractTitle(html);
  const date = extractDate(html);
  const subtitle = extractSubtitle(html);
  const heroImage = extractHeroImage(html);
  const body = extractBody(html);

  if (!title || !date) {
    console.log(`  SKIP (no title/date): ${file}`);
    skipped++;
    continue;
  }

  // Fix <br> inside <strong> tags — prevents turndown from splitting bold across lines
  let fixedBody = body.replace(/<strong([^>]*)>([\s\S]*?)<\/strong>/g, (_match, attrs, content) => {
    const cleaned = content.replace(/<br\s*\/?>/g, ' ');
    return `<strong${attrs}>${cleaned}</strong>`;
  });

  // Fix <pre> tags — replace <br> with newlines and strip inline formatting tags
  fixedBody = fixedBody.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/g, (_match, attrs, content) => {
    let cleaned = content.replace(/<br\s*\/?>/g, '\n');
    cleaned = cleaned.replace(/<\/?(strong|em|b|i|span|a)[^>]*>/g, '');
    return `<pre${attrs}>${cleaned}</pre>`;
  });

  // Convert HTML body to markdown
  let markdown = turndown.turndown(fixedBody);

  // Rewrite internal Medium links to local blog paths
  markdown = rewriteMediumLinks(markdown);

  // Remove the hero image from body (it's already shown by the layout)
  if (heroImage) {
    const escapedUrl = heroImage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    markdown = markdown.replace(new RegExp(`\\n*!\\[[^\\]]*\\]\\(${escapedUrl}\\)\\n*`), '\n\n');
  }

  // Fix broken bold markers: **text  \n    ** → **text**\n
  markdown = markdown.replace(/\*\*([^*]+?)\s{2,}\n(\s*)\*\*/g, '**$1**\n$2');

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  // Remove trailing Medium boilerplate
  markdown = markdown.replace(/\n*If you enjoyed this article.*$/s, '');
  markdown = markdown.replace(/\n*Would you like to learn more\?.*$/s, '');
  markdown = markdown.replace(/\n*And if you enjoyed this post.*$/s, '');
  markdown = markdown.replace(/\n*Thank you for reading!.*$/s, '');
  markdown = markdown.replace(/\n*If you like this post.*$/s, '');
  markdown = markdown.replace(/\n*\*Thank you for reading!\*.*$/s, '');

  // Generate unique slug
  let slug = generateSlug(file);
  if (slugs.has(slug)) {
    slug = `${slug}-${date}`;
  }
  slugs.add(slug);

  // Build frontmatter
  const frontmatter = [
    '---',
    `title: ${escapeYaml(title)}`,
    `date: "${date}"`,
  ];
  if (subtitle) frontmatter.push(`description: ${escapeYaml(subtitle)}`);
  if (heroImage) frontmatter.push(`heroImage: "${heroImage}"`);
  frontmatter.push('---');

  const output = frontmatter.join('\n') + '\n\n' + markdown + '\n';
  const outputPath = join(OUTPUT_DIR, `${slug}.md`);
  writeFileSync(outputPath, output);

  console.log(`  OK: ${slug}.md (${title.slice(0, 50)}...)`);
  imported++;
}

console.log(`\nDone! Imported: ${imported}, Skipped: ${skipped}`);
