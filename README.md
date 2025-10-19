# zkMarek Blog

A Medium-style blog built with Astro and MDX, featuring blog posts about blockchain, cryptography, and software development.

## Features

- 📝 **57 Blog Posts** - All posts from MDX files with frontmatter support
- 📄 **Pagination** - 20 posts per page with easy navigation
- 📱 **Responsive Design** - Mobile-first design following Medium's aesthetic
- 🔗 **Social Sharing** - Share to X (Twitter), Facebook, LinkedIn, or copy link
- 🔖 **Bookmarking** - Browser bookmark functionality
- 🎨 **Clean UI** - System fonts, white background, minimal design

## Tech Stack

- **Astro** - Static site generator
- **MDX** - Markdown with JSX support
- **TypeScript** - Type-safe development

## Project Structure

```
/
├── public/
│   └── images/           # Blog post images
├── src/
│   ├── components/       # Reusable Astro components
│   │   ├── PostCard.astro
│   │   ├── Pagination.astro
│   │   └── ShareButton.astro
│   ├── layouts/          # Page layouts
│   │   └── BaseLayout.astro
│   ├── pages/            # Routes
│   │   ├── index.astro   # Home page
│   │   ├── page/         # Pagination routes
│   │   └── posts/        # Blog post routes
│   ├── posts/            # MDX blog posts (69 files)
│   └── utils/            # Utility functions
│       └── posts.ts      # Post parsing, sorting, pagination
└── astro.config.mjs      # Astro configuration
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Blog Post Format

Each post is an MDX file with frontmatter:

```mdx
---
title: "Post Title"
author: "Marek Kirejczyk"
date: "2025-08-24"
heroImage: "/images/posts/image.png"
---

Post content here...
```

## URL Structure

- Home: `/`
- Pagination: `/page/2`, `/page/3`, etc.
- Blog posts: `/posts/[slug]`

## Author

**zkMarek** - Marek Kirejczyk
- X (Twitter): [@zkmarek](https://x.com/zkmarek)
- LinkedIn: [kirejczyk](https://www.linkedin.com/in/kirejczyk/)

