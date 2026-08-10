/**
 * Shared public news/blog data layer.
 * Table: blog_posts
 */

import { createPublicClient } from '@/lib/supabase/public';
import { logger } from '@/lib/logger';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  category: string | null;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
}

export interface BlogPostFull extends BlogPost {
  content: string;
  author_id: string | null;
}

const LIST_COLS = 'id, title, slug, excerpt, featured_image, category, tags, published_at, created_at';
const FULL_COLS = `${LIST_COLS}, content, author_id`;

function getDb() {
  return createPublicClient();
}

export async function getPublishedPosts(opts: { limit?: number; category?: string } = {}): Promise<BlogPost[]> {
  const db = getDb();
  let query = db
    .from('blog_posts')
    .select(LIST_COLS)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(opts.limit ?? 20);

  if (opts.category) query = query.eq('category', opts.category);

  const { data, error } = await query;
  if (error) {
    logger.error('[news] getPublishedPosts error:', error.message);
    return [];
  }
  return (data ?? []) as BlogPost[];
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const { data, error } = await getDb()
    .from('blog_posts')
    .select(LIST_COLS)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('[news] getFeaturedPost error:', error.message);
    return null;
  }
  return data as BlogPost | null;
}

export async function getPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const { data, error } = await getDb()
    .from('blog_posts')
    .select(FULL_COLS)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    logger.error('[news] getPostBySlug error:', error.message);
    return null;
  }
  return data as BlogPostFull | null;
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await getDb()
    .from('blog_posts')
    .select('category')
    .eq('published', true)
    .not('category', 'is', null);

  if (error) return [];
  return [...new Set((data ?? []).map((row: any) => row.category).filter(Boolean))] as string[];
}

export function formatPostDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
