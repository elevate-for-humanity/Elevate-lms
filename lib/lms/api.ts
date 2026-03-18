/**
 * Server-side data access for LMS pages.
 * Uses Supabase directly — do not call fetch('/api/...') from server components.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Program, CourseProgress } from './types';

async function getDb() {
  const admin = createAdminClient();
  if (admin) return admin;
  return await createClient();
}

export async function getPrograms(): Promise<Program[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('programs')
    .select('id, title, slug, description, image_url, duration, certification, is_active')
    .eq('is_active', true)
    .order('title');

  if (error || !data) return [];

  return data.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    description: p.description ?? '',
    image: p.image_url ?? undefined,
    duration: p.duration ?? undefined,
    certification: p.certification ?? undefined,
    is_active: p.is_active,
  }));
}

export async function getProgramById(id: string): Promise<Program | null> {
  const db = await getDb();
  const { data, error } = await db
    .from('programs')
    .select(`
      id, title, slug, description, image_url, duration, certification,
      is_active,
      modules(id, title, description, order)
    `)
    .or(`id.eq.${id},slug.eq.${id}`)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    description: data.description ?? '',
    image: data.image_url ?? undefined,
    duration: data.duration ?? undefined,
    certification: data.certification ?? undefined,
    is_active: data.is_active,
    modules: (data.modules ?? []).map((m: { id: string; title: string; description?: string; order?: number }) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
    })),
  };
}

/**
 * Returns enrolled courses with progress for the current authenticated user.
 * Caller must ensure the user is authenticated before calling this.
 */
export async function getUserCourses(userId: string): Promise<CourseProgress[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('program_enrollments')
    .select('id, status, progress_percent, program_id, programs(id, title, slug)')
    .eq('user_id', userId)
    .in('status', ['active', 'enrolled', 'in_progress']);

  if (error || !data) return [];

  return data.map((e) => {
    const program = Array.isArray(e.programs) ? e.programs[0] : e.programs;
    return {
      id: e.id,
      title: program?.title ?? 'Untitled Program',
      slug: program?.slug ?? '',
      progress: e.progress_percent ?? 0,
      status: e.status,
      courseId: program?.id,
    };
  });
}
