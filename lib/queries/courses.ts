import { logger } from '@/lib/logger';

/**
 * Database Queries for Courses
 * Centralized queries for courses table
 */

import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Course {
  id: string;
  program_id: string | null;
  title: string;
  description: string | null;
  order_index: number;
  duration_hours: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all active courses
 */
export async function getAllCourses(supabase?: SupabaseClient) {
  const client = supabase || await createClient();

  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('active', true)
    .order('order_index');

  if (error) {
    logger.error('Error fetching courses:', error);
    return { courses: [], error };
  }

  return { courses: data as Course[], error: null };
}

/**
 * Get courses by program ID
 */
export async function getCoursesByProgram(
  programId: string,
  supabase?: SupabaseClient
) {
  const client = supabase || await createClient();

  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('program_id', programId)
    .eq('active', true)
    .order('order_index');

  if (error) {
    logger.error('Error fetching courses by program:', error);
    return { courses: [], error };
  }

  return { courses: data as Course[], error: null };
}

/**
 * Get course by ID
 */
export async function getCourseById(id: string, supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single();

  if (error) {
    logger.error('Error fetching course:', error);
    return { course: null, error };
  }

  return { course: data as Course, error: null };
}

/**
 * Get course count
 */
export async function getCourseCount(supabase?: SupabaseClient) {
  const client = supabase || createClient();

  const { count, error } = await client
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('active', true);

  if (error) {
    logger.error('Error counting courses:', error);
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
}
