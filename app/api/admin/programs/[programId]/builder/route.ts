/**
 * PATCH /api/admin/programs/[programId]/builder
 *
 * Accepts the full ProgramBuilderState payload and upserts all nested tables:
 *   programs (core fields)
 *   program_outcomes
 *   program_credentials
 *   program_modules + program_lessons
 *   program_ctas
 *   program_tracks
 *
 * Uses service-role client for all writes — RLS is enforced at the auth layer.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authGuard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 as const };
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 as const };
  }
  return { user, db };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ programId: string }> }
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const { programId } = await params;
  const auth = await authGuard();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { db } = auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return safeError('Invalid JSON', 400);
  }

  try {
    // ── 1. Core program fields ──────────────────────────────────────────────
    const { error: programErr } = await db.from('programs').update({
      title:           body.title           ?? undefined,
      slug:            body.slug            ?? undefined,
      category:        body.category        ?? undefined,
      description:     body.description     ?? undefined,
      hero_image_url:  body.hero_image_url  ?? undefined,
      estimated_weeks: body.estimated_weeks ?? undefined,
      estimated_hours: body.estimated_hours ?? undefined,
      delivery_method: body.delivery_method ?? undefined,
      wioa_approved:   body.wioa_approved   ?? undefined,
      dol_registered:  body.dol_registered  ?? undefined,
      updated_at:      new Date().toISOString(),
    }).eq('id', programId);

    if (programErr) return safeError(`Program update failed: ${programErr.message}`, 500);

    // ── 2. Outcomes — delete-and-reinsert (simple, ordered) ────────────────
    if (Array.isArray(body.outcomes)) {
      await db.from('program_outcomes').delete().eq('program_id', programId);
      if (body.outcomes.length > 0) {
        const rows = body.outcomes.map((o: any, i: number) => ({
          program_id:    programId,
          outcome:       o.text,
          outcome_order: i,
        }));
        const { error } = await db.from('program_outcomes').insert(rows);
        if (error) return safeError(`Outcomes save failed: ${error.message}`, 500);
      }
    }

    // ── 3. Credentials — upsert join table ─────────────────────────────────
    if (Array.isArray(body.credentials)) {
      await db.from('program_credentials').delete().eq('program_id', programId);
      if (body.credentials.length > 0) {
        const rows = body.credentials.map((c: any, i: number) => ({
          program_id:    programId,
          credential_id: c.credential_id,
          is_required:   c.is_required ?? true,
          sort_order:    i,
        }));
        const { error } = await db.from('program_credentials').insert(rows);
        if (error) return safeError(`Credentials save failed: ${error.message}`, 500);
      }
    }

    // ── 4. Modules + lessons ────────────────────────────────────────────────
    // Phases are a UI concept — flatten to modules for storage
    if (Array.isArray(body.phases)) {
      // Collect all module IDs being saved so we can delete orphans
      const incomingModuleIds: string[] = [];

      for (const phase of body.phases) {
        if (!Array.isArray(phase.modules)) continue;

        for (const mod of phase.modules) {
          const isNew = !mod.id || mod.id === 'default';

          if (isNew) {
            // Insert new module
            const { data: newMod, error } = await db
              .from('program_modules')
              .insert({
                program_id: programId,
                title:      mod.title,
                sort_order: mod.sort_order ?? 0,
                module_number: mod.sort_order ?? 0,
              })
              .select('id')
              .single();
            if (error || !newMod) continue;
            incomingModuleIds.push(newMod.id);
            await upsertLessons(db, newMod.id, mod.lessons ?? []);
          } else {
            // Update existing module
            await db.from('program_modules').update({
              title:      mod.title,
              sort_order: mod.sort_order ?? 0,
            }).eq('id', mod.id).eq('program_id', programId);
            incomingModuleIds.push(mod.id);
            await upsertLessons(db, mod.id, mod.lessons ?? []);
          }
        }
      }

      // Delete modules that were removed in the builder
      if (incomingModuleIds.length > 0) {
        await db
          .from('program_modules')
          .delete()
          .eq('program_id', programId)
          .not('id', 'in', `(${incomingModuleIds.map(id => `'${id}'`).join(',')})`);
      } else {
        // All modules removed
        await db.from('program_modules').delete().eq('program_id', programId);
      }
    }

    // ── 5. CTAs ─────────────────────────────────────────────────────────────
    if (Array.isArray(body.ctas)) {
      await db.from('program_ctas').delete().eq('program_id', programId);
      if (body.ctas.length > 0) {
        const rows = body.ctas.map((c: any, i: number) => ({
          program_id:    programId,
          cta_type:      c.cta_type,
          label:         c.label,
          href:          c.href,
          style_variant: c.style_variant ?? 'primary',
          is_external:   c.cta_type === 'external',
          sort_order:    i,
        }));
        const { error } = await db.from('program_ctas').insert(rows);
        if (error) return safeError(`CTAs save failed: ${error.message}`, 500);
      }
    }

    // ── 6. Tracks ───────────────────────────────────────────────────────────
    if (Array.isArray(body.tracks)) {
      await db.from('program_tracks').delete().eq('program_id', programId);
      if (body.tracks.length > 0) {
        const rows = body.tracks.map((t: any, i: number) => ({
          program_id:   programId,
          track_code:   t.track_code,
          title:        t.title,
          funding_type: t.funding_type,
          cost_cents:   t.cost_cents ?? null,
          available:    t.available ?? true,
          sort_order:   i,
        }));
        const { error } = await db.from('program_tracks').insert(rows);
        if (error) return safeError(`Tracks save failed: ${error.message}`, 500);
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return safeInternalError(err, 'Builder save failed');
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertLessons(db: any, moduleId: string, lessons: any[]) {
  const incomingIds: string[] = [];

  for (const lesson of lessons) {
    const isNew = !lesson.id;
    if (isNew) {
      const { data: newLesson } = await db
        .from('program_lessons')
        .insert({
          module_id:        moduleId,
          title:            lesson.title,
          lesson_type:      normalizeLessonType(lesson.lesson_type),
          sort_order:       lesson.sort_order ?? 0,
          lesson_number:    lesson.sort_order ?? 0,
          duration_minutes: lesson.duration_minutes ?? null,
        })
        .select('id')
        .single();
      if (newLesson) incomingIds.push(newLesson.id);
    } else {
      await db.from('program_lessons').update({
        title:            lesson.title,
        lesson_type:      normalizeLessonType(lesson.lesson_type),
        sort_order:       lesson.sort_order ?? 0,
        duration_minutes: lesson.duration_minutes ?? null,
      }).eq('id', lesson.id).eq('module_id', moduleId);
      incomingIds.push(lesson.id);
    }
  }

  // Delete removed lessons
  if (incomingIds.length > 0) {
    await db
      .from('program_lessons')
      .delete()
      .eq('module_id', moduleId)
      .not('id', 'in', `(${incomingIds.map(id => `'${id}'`).join(',')})`);
  } else {
    await db.from('program_lessons').delete().eq('module_id', moduleId);
  }
}

// program_lessons CHECK: ('lesson','quiz','lab','exam','orientation')
// checkpoint is not in the constraint yet — map it to lesson until migration applied
function normalizeLessonType(type: string): string {
  const valid = ['lesson', 'quiz', 'lab', 'exam', 'orientation'];
  return valid.includes(type) ? type : 'lesson';
}
