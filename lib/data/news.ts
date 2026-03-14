/**
 * Shared news/blog data layer.
 * Table: blog_posts
 * Columns: id, title, slug, excerpt, content, featured_image,
 *          author_id, category, tags, published, published_at, created_at
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

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

async function getDb() {
  const admin = createAdminClient();
  if (admin) return admin;
  return await createClient();
}

export async function getPublishedPosts(opts: { limit?: number; category?: string } = {}): Promise<BlogPost[]> {
  const db = await getDb();
  let q = db
    .from('blog_posts')
    .select(LIST_COLS)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(opts.limit ?? 20);

  if (opts.category) q = q.eq('category', opts.category);

  const { data, error } = await q;
  if (error) {
    console.error('[news] getPublishedPosts error:', error.message);
    return [];
  }
  return (data ?? []) as BlogPost[];
}

export async function getFeaturedPost(): Promise<BlogPost | null> {
  const db = await getDb();
  const { data, error } = await db
    .from('blog_posts')
    .select(LIST_COLS)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[news] getFeaturedPost error:', error.message);
    return null;
  }
  return data as BlogPost | null;
}

export async function getPostBySlug(slug: string): Promise<BlogPostFull | null> {
  const db = await getDb();
  const { data, error } = await db
    .from('blog_posts')
    .select(FULL_COLS)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    console.error('[news] getPostBySlug error:', error.message);
    return null;
  }
  return data as BlogPostFull | null;
}

export async function getCategories(): Promise<string[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('blog_posts')
    .select('category')
    .eq('published', true)
    .not('category', 'is', null);

  if (error) return [];
  const cats = [...new Set((data ?? []).map((r: any) => r.category).filter(Boolean))];
  return cats as string[];
}

export function formatPostDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}
