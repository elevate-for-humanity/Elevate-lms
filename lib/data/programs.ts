/**
 * Hybrid Program Data Service
 * Integrates Supabase database with centralized programs.ts fallback
 */

import { createClient } from '@/lib/supabase/server';
import { programs as staticPrograms } from '@/app/data/programs';

/**
 * Get a single program by slug
 * Priority: Supabase → Static programs.ts
 */
export async function getProgram(slug: string): Promise<Program | null> {
  try {
    // Try Supabase first
    const supabase = await createClient();
    const { data: supabaseProgram, error } = await supabase
      .from('programs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!error && supabaseProgram) {
      // Map Supabase data to Program type
      return mapSupabaseProgramToProgram(supabaseProgram);
    }
  } catch (error) { /* Error handled silently */ 
    // Error handled
  }

  // Fallback to static programs.ts
  return staticPrograms.find((p) => p.slug === slug) || null;
}

/**
 * Get all active programs
 * Priority: Supabase → Static programs.ts
 */
export async function getAllPrograms(): Promise<Program[]> {
  try {
    // Try Supabase first
    const supabase = await createClient();
    const { data: supabasePrograms, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('featured', { ascending: false })
      .order('name', { ascending: true });

    if (!error && supabasePrograms && supabasePrograms.length > 0) {
      // Map Supabase data to Program type
      return supabasePrograms.map(mapSupabaseProgramToProgram);
    }
  } catch (error) { /* Error handled silently */ 
    // Error handled
  }

  // Fallback to static programs.ts
  return staticPrograms;
}

/**
 * Map Supabase program data to Program type
 * Handles field name differences and ensures type compatibility
 */
function mapSupabaseProgramToProgram(data: any): Program {
  return {
    slug: data.slug,
    name: data.name || data.title,
    heroTitle: data.hero_title || data.title || data.name,
    heroSubtitle: data.hero_subtitle || data.description || '',
    shortDescription: data.short_description || data.description || '',
    longDescription: data.long_description || data.description || '',
    heroImage:
      data.hero_image || data.image_url || getDefaultHeroImage(data.slug),
    heroImageAlt: data.hero_image_alt || `${data.name} program`,
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
    ctaPrimary: {
      label: 'Start Application',
      href: `/apply?program=${data.slug}`,
    },
    ctaSecondary: {
      label: 'Talk to a Career Coach',
      href: `/contact?topic=${data.slug}`,
    },
  };
}

/**
 * Get default hero image based on slug
 */
function getDefaultHeroImage(slug: string): string {
  const imageMap: Record<string, string> = {
    'hvac-technician': '/images/programs/hvac-hero.jpg',
    'barber-apprenticeship': '/images/programs/barber-hero.jpg',
    cna: '/images/programs/cna-hero.jpg',
    cdl: '/images/programs/cdl-hero.jpg',
    'building-maintenance': '/images/programs/building-maintenance-hero.jpg',
    'building-technician': '/images/programs/building-technician-hero.jpg',
    'workforce-readiness': '/images/programs/workforce-readiness-hero.jpg',
  };

  return imageMap[slug] || '/images/artlist/hero-training-1.jpg';
}

/**
 * Format duration from weeks to readable string
 */
function formatDuration(weeks?: number): string {
  if (!weeks) return 'Varies by program';
  if (weeks < 4) return `${weeks} weeks`;
  if (weeks < 12) return `${weeks} weeks`;
  return `${Math.floor(weeks / 4)}–${Math.ceil(weeks / 4)} months`;
}
