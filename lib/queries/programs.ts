import { logger } from '@/lib/logger';

/**
 * Database Queries for Programs
 * Centralized queries for programs table
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Program {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration: string | null;
  schedule: string | null;
  delivery: string | null;
  price: number | null;
  credential: string | null;
  etpl_approved: boolean;
  etpl_program_id: string | null;
  cip_code: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

/**
 * Get all active programs
 */
export async function getAllPrograms(supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { data, error } = await client
    .from('programs')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    logger.error('Error fetching programs:', error);
    return { programs: [], error };
  }

  return { programs: data as Program[], error: null };
}

/**
 * Get program by slug
 */
export async function getProgramBySlug(slug: string, supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { data, error } = await client
    .from('programs')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error) {
    logger.error('Error fetching program:', error);
    return { program: null, error };
  }

  return { program: data as Program, error: null };
}

/**
 * Get programs by funding source
 */
export async function getProgramsByFunding(
  fundingSource: string,
  supabase?: SupabaseClient
) {
  const client = supabase || createClient();

  const { data, error } = await client
    .from('programs')
    .select('*')
    .eq('active', true)
    .contains('metadata->funding', [fundingSource])
    .order('name');

  if (error) {
    logger.error('Error fetching programs by funding:', error);
    return { programs: [], error };
  }

  return { programs: data as Program[], error: null };
}

/**
 * Get ETPL approved programs
 */
export async function getETPLPrograms(supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { data, error } = await client
    .from('programs')
    .select('*')
    .eq('active', true)
    .eq('etpl_approved', true)
    .order('name');

  if (error) {
    logger.error('Error fetching ETPL programs:', error);
    return { programs: [], error };
  }

  return { programs: data as Program[], error: null };
}

/**
 * Search programs by name or description
 */
export async function searchPrograms(query: string, supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { data, error } = await client
    .from('programs')
    .select('*')
    .eq('active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .order('name');

  if (error) {
    logger.error('Error searching programs:', error);
    return { programs: [], error };
  }

  return { programs: data as Program[], error: null };
}

/**
 * Get program count
 */
export async function getProgramCount(supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { count, error } = await client
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  if (error) {
    logger.error('Error counting programs:', error);
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
}

/**
 * Get programs with courses
 */
export async function getProgramsWithCourses(supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { data, error } = await client
    .from('programs')
    .select(`
      *,
      courses (
        id,
        title,
        description,
        duration_hours,
        order_index
      )
    `)
    .eq('active', true)
    .order('name');

  if (error) {
    logger.error('Error fetching programs with courses:', error);
    return { programs: [], error };
  }

  return { programs: data, error: null };
}
