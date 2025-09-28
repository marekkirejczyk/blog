# HTML to MDX Conversion Plan

## Overview
Convert HTML blog posts from Medium export to MDX format compatible with Astro.

## Current State Analysis
- 69 HTML files in `/import/` directory
- Files are Medium exports with consistent structure
- Each file contains:
  - Title in `<h1 class="p-name">`
  - Author and date in footer
  - Content in `<section data-field="body" class="e-content">`
  - Images with Medium CDN URLs
  - Various HTML elements (headings, paragraphs, lists, figures)

## Conversion Requirements

### 1. Header Structure
- Extract title, author, date, and tags from HTML
- Make first image part of header (hero image)
- Include metadata in frontmatter:
  - `title`: from `<h1 class="p-name">` (fallback: "Unknown title")
  - `author`: from footer `<a class="p-author h-card">` (fallback: "Unknown author")
  - `date`: from footer `<time class="dt-published">` in YYYY-MM-DD format (fallback: "Unknown date")
  - `heroImage`: first image in content (fallback: "Unknown image")
  - `tags`: generate 3-5 tags using topic modeling from content analysis


### 2. Content Processing
- Convert HTML content to MDX format
- Remove title, author, date from content body (keep only in frontmatter)
- Remove footer completely (author info, canonical link, export info)
- Convert HTML elements to native MDX equivalents:
  - `<h1>` → `#` (content headings)
  - `<h2>` → `##`
  - `<h3>` → `###`
  - `<h4>` → `####`
  - `<h5>` → `#####`
  - `<h6>` → `######`
  - `<p>` → paragraph
  - `<ul>` → `-` unordered lists
  - `<ol>` → `1.` ordered lists
  - `<li>` → list items (preserve nesting)
  - `<figure>` → `![alt](src)`
  - `<strong>` → `**bold**`
  - `<em>` → `*italic*`
  - `<a>` → `[text](url)`
  - `<pre><code>` → ```language code blocks``` (with language detection)
  - `<code>` → `inline code`
  - `<table>` → markdown tables (simple tables only)
  - `<blockquote>` → `>` blockquotes
  - Embedded videos/tweets → custom MDX components

### 2.1 Language Detection for Code Blocks
- Use filename extension from Medium CDN URLs when available
- Fallback to content analysis for common patterns:
  - `function`, `const`, `let`, `var` → JavaScript
  - `def`, `import` → Python
  - `#include`, `int main` → C/C++
  - `SELECT`, `FROM`, `WHERE` → SQL
  - `<!DOCTYPE`, `<html>` → HTML
  - `{`, `}` with CSS properties → CSS
- Default to `text` if no language can be detected

### 3. Image Handling
- Images are already available in `/public/images/posts/` directory
- Update all image references from Medium CDN URLs to local paths
- Map each Medium CDN URL to local file with same name and extension
- Use path format: `/images/posts/filename.ext`
- Preserve image metadata (alt text, captions)

### 4. File Organization
- Create MDX files in existing `/src/posts/` directory
- Use slugified filenames based on titles
- Flat structure - all posts in single directory
- Ensure unique slugs (no duplicates)

## Requirements Clarified

1. **Output Directory Structure**: Flat structure - all MDX files in `/src/posts/` directory
2. **Image Directory**: Use plain folder structure `/public/images/posts/` (no subfolders per post)
3. **Frontmatter Fields**: Include author, tags (3-5 tags from topic modeling), heroImage, date (ISO format YYYY-MM-DD)
4. **Content Processing**: Convert as much as possible to standard MDX native elements
5. **File Naming**: Use convention `YYYY-MM-DD-slug.mdx` (e.g., `2023-09-13-adhd-joy-pain.mdx`)
6. **Draft Posts**: Process drafts as well, keep "draft_" prefix in filename (original HTML files with "draft_" prefix are drafts)
7. **Complex Elements**: Convert to MDX native elements (code blocks, simple tables, blockquotes) and custom components (embedded videos/tweets)
8. **Error Handling**: Always prefix with "Unknown" for missing metadata (Unknown title, Unknown author, Unknown date, Unknown image)
9. **Custom Components**: Use as few custom components as possible, prefer native MDX elements

## Implementation Steps

1. **Setup**: Create directory structure and dependencies
2. **HTML Parser**: Build parser to extract metadata and content
3. **Tag Generation**: Implement content analysis for tag generation
4. **Image Relinking**: Map Medium CDN URLs to local files with same name/extension in `/public/images/posts/`
5. **Content Converter**: Convert HTML to native MDX format with language detection for code blocks
6. **File Generator**: Create MDX files with proper frontmatter and unique slugs
7. **Validation**: Verify all conversions are correct
8. **Cleanup**: Remove original HTML files (optional)

## Tools and Dependencies

- HTML parser (cheerio or similar)
- MDX file generator
- File system utilities
- Date parsing utilities
- Topic modeling library for tag generation
- Language detection library for code blocks
- Slug generation utility for unique filenames
