import { createClient } from '@/lib/supabase/server';
import { createStaticClient } from '@/lib/supabase/static';

export type Program = {
  id: string;
  slug: string;
  name: string;
  title: string;
  category: string;
  description: string;
  full_description?: string;
  what_you_learn?: string[];
  funding_tags?: string[];
  funding_pathways?: string[];
  estimated_hours?: number;
  training_hours?: number;
  is_active: boolean;
  wioa_approved?: boolean;
  hero_image_url?: string;
  image_url?: string;
};

/**
 * Get all programs - for build-time use (generateStaticParams)
 */
export async function getAllProgramsStatic(): Promise<Program[]> {
  const supabase = createStaticClient();

  const { data: programs, error } = await supabase
    .from('programs')
    .select('*')
    .eq('is_active', true)
    .order('title');

  if (error) {
    // Error: $1
    return [];
  }

  return programs || [];
}

/**
 * Get all programs - for runtime use
 */
export async function getAllPrograms(): Promise<Program[]> {
  const supabase = await createClient();

  const { data: programs, error } = await supabase
    .from('programs')
    .select('*')
    .eq('is_active', true)
    .order('title');

  if (error) {
    // Error: $1
    return [];
  }

  return programs || [];
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const supabase = await createClient();

  const { data: program, error } = await supabase
    .from('programs')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    // Error: $1
    return null;
  }

  return program;
}
