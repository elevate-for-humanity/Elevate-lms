/**
 * Program data service — DB-only.
 * Queries the `programs` table directly. No static fallback.
 */

import { createClient } from '@/lib/supabase/server';

function getDefaultHeroImage(slug: string): string {
  return '/images/pages/comp-home-hero-programs.jpg';
}

function formatDuration(weeks?: number): string {
  if (!weeks) return 'Varies by program';
  if (weeks < 12) return `${weeks} weeks`;
  return `${Math.floor(weeks / 4)}–${Math.ceil(weeks / 4)} months`;
}

function mapRow(data: any): Program {
  return {
    slug: data.slug,
    name: data.name || data.title,
    heroTitle: data.hero_title || data.title || data.name,
    heroSubtitle: data.hero_subtitle || data.description || '',
    shortDescription: data.short_description || data.description || '',
    longDescription: data.long_description || data.description || '',
    heroImage: data.hero_image || data.image_url || getDefaultHeroImage(data.slug),
    heroImageAlt: data.hero_image_alt || `${data.name || data.title} program`,
    duration: data.duration || formatDuration(data.duration_weeks),
    schedule: data.schedule || 'Flexible scheduling available',
    delivery: data.delivery || 'Hybrid: Online + In-person',
    credential: data.credential || 'Program completion certificate',
    approvals: data.approvals || [],
    fundingOptions: data.funding_options || [],
    highlights: data.highlights || [],
    whatYouLearn: data.what_you_learn || [],
    outcomes: data.outcomes || [],
    requirements: data.requirements || [],
    ctaPrimary: { label: 'Start Application', href: `/apply?program=${data.slug}` },
    ctaSecondary: { label: 'Talk to a Career Coach', href: `/contact?topic=${data.slug}` },
  };
}

export async function getProgram(slug: string): Promise<Program | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();
  return data ? mapRow(data) : null;
}

export async function getAllPrograms(): Promise<Program[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('programs')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });
  return (data ?? []).map(mapRow);
}
