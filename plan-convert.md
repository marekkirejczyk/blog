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
  - `title`: from `<h1 class="p-name">`
  - `author`: from footer `<a class="p-author h-card">` (fallback: "Unknown author")
  - `date`: from footer `<time class="dt-published">` in ISO format YYYY-MM-DD (fallback: "Unknown date")
  - `heroImage`: first image in content (if exists)
  - `tags`: generate 3-5 tags using topic modeling from content analysis


### 2. Content Processing
- Convert HTML content to MDX format
- Remove title, author, date from content body (keep only in frontmatter)
- Remove footer completely (author info, canonical link, export info)
- Convert HTML elements to native MDX equivalents:
  - `<h3>` → `##` (since title is h1 in frontmatter)
  - `<h4>` → `###`
  - `<p>` → paragraph
  - `<ul>` → `-` lists
  - `<figure>` → `![alt](src)`
  - `<strong>` → `**bold**`
  - `<em>` → `*italic*`
  - `<a>` → `[text](url)`
  - `<pre><code>` → ```code blocks```
  - `<table>` → markdown tables
  - `<blockquote>` → `>` blockquotes
  - Embedded videos/tweets → native MDX embed syntax

### 3. Image Handling
- Images are already available in `/public/images/posts/` directory
- Update all image references from Medium CDN URLs to local paths
- Handle different image sizes and formats
- Preserve image metadata (alt text, captions)

### 4. File Organization
- Create MDX files in `/src/posts/` directory
- Use slugified filenames based on titles
- Flat structure - all posts in single directory

## Requirements Clarified

1. **Output Directory Structure**: Flat structure - all MDX files in `/src/posts/` directory
2. **Image Directory**: Use plain folder structure `/public/images/posts/` (no subfolders per post)
3. **Frontmatter Fields**: Include author, tags (3-5 tags from topic modeling), heroImage, date (ISO format YYYY-MM-DD)
4. **Content Processing**: Convert as much as possible to standard MDX native elements
5. **File Naming**: Use convention `YYYY-MM-DD-slug.mdx` (e.g., `2023-09-13-adhd-joy-pain.mdx`)
6. **Draft Posts**: Process drafts as well, keep "draft_" prefix in filename (original HTML files with "draft_" prefix are drafts)
7. **Complex Elements**: Convert to MDX native elements (code blocks, tables, blockquotes, embedded videos/tweets)
8. **Error Handling**: Use fallbacks like "Unknown author", "Unknown date" for missing metadata
9. **Custom Components**: Use as few custom components as possible, prefer native MDX elements

## Implementation Steps

1. **Setup**: Create directory structure and dependencies
2. **HTML Parser**: Build parser to extract metadata and content
3. **Tag Generation**: Implement content analysis for tag generation
4. **Image Relinking**: Update image references from Medium CDN to local paths in `/public/images/posts/`
5. **Content Converter**: Convert HTML to native MDX format
6. **File Generator**: Create MDX files with proper frontmatter
7. **Validation**: Verify all conversions are correct
8. **Cleanup**: Remove original HTML files (optional)

## Tools and Dependencies

- HTML parser (cheerio or similar)
- MDX file generator
- File system utilities
- Date parsing utilities
- Topic modeling library for tag generation
