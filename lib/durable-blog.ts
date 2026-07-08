// Durable Blog Integration
// Fetches blog posts from Durable platform

export interface DurableBlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  category?: string;
  published_at: string;
  author?: string;
  source: 'durable';
}

/**
 * Fetch blog posts from Durable
 * Options:
 * 1. RSS Feed: https://elevateforhumanity.durable.co/blog/rss
 * 2. API endpoint (if available)
 * 3. Web scraping (last resort)
 */
export async function fetchDurableBlogPosts(): Promise<DurableBlogPost[]> {
  try {
    // Option 1: Try RSS feed first
    const rssUrl = 'https://elevateforhumanity.durable.co/blog/rss';
    const response = await fetch(rssUrl, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (response.ok) {
      const rssText = await response.text();
      return parseRSSFeed(rssText);
    }

    // Option 2: Try JSON API if available
    const apiUrl = 'https://elevateforhumanity.durable.co/api/blog';
    const apiResponse = await fetch(apiUrl, {
      next: { revalidate: 300 },
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      return data.posts || [];
    }

    return [];
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    return [];
  }
}

/**
 * Parse RSS feed to extract blog posts
 */
function parseRSSFeed(rssText: string): DurableBlogPost[] {
  try {
    // Simple RSS parsing (you may want to use a library like 'rss-parser')
    const posts: DurableBlogPost[] = [];

    // Extract items from RSS
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const items = rssText.match(itemRegex) || [];

    items.forEach((item, index) => {
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const description = extractTag(item, 'description');
      const pubDate = extractTag(item, 'pubDate');
      const category = extractTag(item, 'category');

      if (title && link) {
        posts.push({
          id: `durable-${index}`,
          title: cleanHTML(title),
          slug: link.split('/').pop() || '',
          excerpt: cleanHTML(description),
          featured_image: extractImageFromContent(description),
          category: category || 'Blog',
          published_at: pubDate || new Date().toISOString(),
          source: 'durable',
        });
      }
    });

    return posts;
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    return [];
  }
}

/**
 * Extract content from XML tag
 */
function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Clean HTML tags from text
 */
function cleanHTML(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Extract first image from HTML content
 */
function extractImageFromContent(html: string): string | undefined {
  const imgRegex = /<img[^>]+src="([^">]+)"/i;
  const match = html.match(imgRegex);
  return match ? match[1] : undefined;
}

/**
 * Get blog post URL
 */
export function getDurableBlogPostUrl(slug: string): string {
  return `https://elevateforhumanity.durable.co/blog/${slug}`;
}
