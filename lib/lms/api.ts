/**
 * Server-side data access for LMS pages.
 * Uses Supabase admin client directly — do not call fetch('/api/...') from server components.
 *
 * programs table real columns (from migration 20260227000003):
 *   id, slug, title, description, excerpt, image_url, hero_image_url,
 *   estimated_weeks, credential_name, credential, funding_tags,
 *   wioa_approved, published, is_active, status, featured,
 *   short_description (added in 20260402000003), display_order (added in 20260402000003)
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Program, CourseProgress } from './types';
import { logger } from '@/lib/logger';

async function getDb() {
  const admin = await getAdminClient();
  if (admin) return admin;
  return await createClient();
}

export async function getPrograms(): Promise<Program[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('programs')
    .select(
      'id, slug, title, description, short_description, excerpt, image_url, hero_image_url, ' +
      'estimated_weeks, credential_name, credential, funding_tags, wioa_approved, ' +
      'published, is_active, status, featured, display_order'
    )
    .eq('published', true)
    .eq('is_active', true)
    .neq('status', 'archived')
    .order('display_order', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (error) {
    logger.error('getPrograms error:', error.message);
    return [];
  }

  return (data ?? []).map(mapProgram);
}

export async function getProgramBySlug(slug: string): Promise<Program | null> {
  const db = await getDb();
  const { data, error } = await db
    .from('programs')
    .select(
      'id, slug, title, description, short_description, excerpt, full_description, ' +
      'image_url, hero_image_url, estimated_weeks, credential_name, credential, ' +
      'funding_tags, wioa_approved, published, is_active, status, featured, display_order, ' +
      'what_you_learn, career_outcomes, delivery_method, ' +
      'modules(id, title, description, order)'
    )
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();

  if (error) {
    logger.error('getProgramBySlug error:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    ...mapProgram(data),
    overview: data.full_description ?? undefined,
    outcomes: data.career_outcomes ?? data.what_you_learn ?? undefined,
    format: data.delivery_method ?? undefined,
    modules: (data.modules ?? []).map((m: { id: string; title: string; description?: string; order?: number }) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      order: m.order,
    })),
  };
}

/**
 * Returns enrolled programs with progress for an authenticated user.
 */
export async function getUserCourses(userId: string): Promise<CourseProgress[]> {
  const db = await getDb();
  const { data, error } = await db
    .from('program_enrollments')
    .select('id, status, progress_percent, program_id, programs(id, title, slug)')
    .eq('user_id', userId)
    .in('status', ['active', 'enrolled', 'in_progress']);

  if (error) {
    logger.error('getUserCourses error:', error.message);
    return [];
  }

  return (data ?? []).map((e) => {
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

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapProgram(p: Record<string, unknown>): Program {
  return {
    id: p.id as string,
    title: p.title as string,
    slug: p.slug as string,
    // short_description added by migration 20260402000003; falls back to excerpt or description
    description: (p.short_description as string | null)
      ?? (p.excerpt as string | null)
      ?? (p.description as string | null)
      ?? '',
    image: (p.image_url as string | null) ?? (p.hero_image_url as string | null) ?? undefined,
    duration: p.estimated_weeks ? `${p.estimated_weeks} weeks` : undefined,
    // credential_name is the canonical column; credential is a newer alias
    certification: (p.credential_name as string | null) ?? (p.credential as string | null) ?? undefined,
    funded: (p.wioa_approved as boolean | null) ?? false,
    is_active: p.is_active as boolean | undefined,
  };
}
