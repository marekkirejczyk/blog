export interface PostFrontmatter {
  title: string;
  author: string;
  date: string;
  heroImage: string;
  tags?: string[];
}

export interface Post {
  frontmatter: PostFrontmatter;
  url: string;
  slug: string;
  Content: any;
}

/**
 * Extracts slug from filename
 * Removes date prefix if present and .mdx extension
 */
export function getSlugFromFilename(filename: string): string {
  // Remove path and extension
  const basename = filename.split('/').pop()?.replace('.mdx', '') || '';
  
  // Remove date prefix (YYYY-MM-DD-)
  const slug = basename.replace(/^\d{4}-\d{2}-\d{2}-/, '');
  
  return slug;
}

/**
 * Gets all posts, sorted by date (newest first)
 */
export async function getAllPosts(): Promise<Post[]> {
  const posts = await import.meta.glob<{ frontmatter: PostFrontmatter; Content: any }>('/src/posts/*.mdx', { eager: true });
  
  const postList = Object.entries(posts).map(([filepath, post]) => {
    const slug = getSlugFromFilename(filepath);
    return {
      frontmatter: post.frontmatter,
      url: `/posts/${slug}`,
      slug,
      Content: post.Content,
    };
  });

  // Sort by date, newest first
  return postList.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date);
    const dateB = new Date(b.frontmatter.date);
    return dateB.getTime() - dateA.getTime();
  });
}

/**
 * Paginates posts
 */
export function paginatePosts(posts: Post[], page: number = 1, postsPerPage: number = 20) {
  const startIndex = (page - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const paginatedPosts = posts.slice(startIndex, endIndex);
  const totalPages = Math.ceil(posts.length / postsPerPage);

  return {
    posts: paginatedPosts,
    currentPage: page,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Formats date for display
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch {
    return dateString;
  }
}

