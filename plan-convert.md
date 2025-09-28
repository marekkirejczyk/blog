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
- Extract title, author, date, read time, and tags from HTML
- Make first image part of header (hero image)
- Include metadata in frontmatter:
  - `title`: from `<h1 class="p-name">`
  - `author`: from footer `<a class="p-author h-card">`
  - `date`: from footer `<time class="dt-published">`
  - `readTime`: calculate from content length
  - `heroImage`: first image in content (if exists)
  - `tags`: extract from content or generate based on content analysis


### 2. Content Processing
- Convert HTML content to MDX format
- Remove title, author, date from content body (keep only in frontmatter)
- Remove footer completely (author info, canonical link, export info)
- Convert HTML elements to MDX equivalents:
  - `<h3>` → `##` (since title is h1 in frontmatter)
  - `<h4>` → `###`
  - `<p>` → paragraph
  - `<ul>` → `-` lists
  - `<figure>` → `![alt](src)` or custom components
  - `<strong>` → `**bold**`
  - `<em>` → `*italic*`
  - `<a>` → `[text](url)`

### 3. Image Handling
- Download all images from Medium CDN to local directory
- Create organized folder structure (e.g., `/public/images/posts/`)
- Update all image references to local paths
- Handle different image sizes and formats
- Preserve image metadata (alt text, captions)

### 4. File Organization
- Create new directory structure for MDX files
- Use slugified filenames based on titles
- Organize by date or category if needed

## Requirements Clarified

1. **Output Directory Structure**: Flat structure - all MDX files in one directory
2. **Image Directory**: Organize images by post in separate folders
3. **Frontmatter Fields**: Include author, tags, reading time (tags to be extracted from content or generated)
4. **Content Processing**: Convert as much as possible to standard MDX
5. **File Naming**: Use convention `YYYY-MM-DD-slug.mdx` (e.g., `2023-09-13-adhd-joy-pain.mdx`)
6. **Draft Posts**: Process drafts as well, keep "draft_" prefix in filename
7. **Read Time Calculation**: Use reading time from HTML if available, otherwise approximate based on word count
8. **Error Handling**: Handle missing metadata gracefully with fallbacks

## Implementation Steps

1. **Setup**: Create directory structure and dependencies
2. **HTML Parser**: Build parser to extract metadata and content
3. **Tag Extraction**: Implement tag extraction from content analysis
4. **Image Downloader**: Download and organize images
5. **Content Converter**: Convert HTML to MDX format
6. **File Generator**: Create MDX files with proper frontmatter
7. **Validation**: Verify all conversions are correct
8. **Cleanup**: Remove original HTML files (optional)

## Tools and Dependencies

- HTML parser (cheerio or similar)
- Image downloader
- MDX file generator
- File system utilities
- Date parsing utilities
