import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';

/**
 * Marketing Page API
 * 
 * Strict rendering rules:
 * - 404 if page not published
 * - Error if hero missing (dev), 404 (prod)
 * - No default placeholder values
 */

export interface MarketingSection {
  id: string;
  section_type: 'text' | 'features' | 'cta' | 'testimonial' | 'stats' | 'faq';
  heading: string;
  body: string;
  section_order: number;
}

export interface MarketingPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image: string;
  hero_image_alt: string;
  hero_variant: 'full' | 'split' | 'illustration' | 'video';
  hero_video_src: string | null;
  meta_title: string | null;
  meta_description: string | null;
  sections: MarketingSection[];
}

/**
 * Get marketing page by slug with all sections.
 * Returns null if not found or not published.
 * Strict: No fallbacks, no placeholders.
 */
export async function getMarketingPageBySlug(slug: string): Promise<MarketingPage | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const { data: page, error } = await supabase
    .from('marketing_pages')
    .select(`
      id,
      slug,
      title,
      subtitle,
      hero_image,
      hero_image_alt,
      hero_variant,
      hero_video_src,
      meta_title,
      meta_description
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single();

  if (error || !page) {
    return null;
  }

  // Strict: Hero image required
  if (!page.hero_image || !page.hero_image_alt) {
    if (process.env.NODE_ENV === 'development') {
      logger.error(`Marketing page "${slug}" missing hero image`);
    }
    return null;
  }

  // Fetch sections
  const { data: sections } = await supabase
    .from('marketing_sections')
    .select('id, section_type, heading, body, section_order')
    .eq('page_id', page.id)
    .order('section_order', { ascending: true });

  return {
    ...page,
    sections: sections || [],
  } as MarketingPage;
}

/**
 * Get all published marketing pages (for sitemap, nav, etc.)
 */
export async function getAllMarketingPages(): Promise<{ slug: string; title: string }[]> {
  const supabase = await createClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from('marketing_pages')
    .select('slug, title')
    .eq('published', true)
    .order('title');

  return data || [];
}
