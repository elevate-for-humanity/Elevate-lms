import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateProgramSchema = z.object({
  title: z.string().trim().min(1).max(250),
  name: z.string().trim().max(250).optional(),
  code: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(160).optional(),
  status: z.string().trim().max(80).optional().default('draft'),
  category: z.string().trim().max(120).nullable().optional(),
  funding_eligible: z.boolean().optional(),
  duration_weeks: z.number().int().positive().nullable().optional(),
  total_hours: z.number().nonnegative().nullable().optional(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 140);
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('programs')
      .select('*')
      .order('title', { ascending: true })
      .limit(500);
    if (error) throw error;

    return NextResponse.json({ ok: true, programs: data ?? [], data: data ?? [] }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load programs');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = CreateProgramSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid program payload', 400);

  try {
    const db = await requireAdminClient();
    const input = parsed.data;
    const baseSlug = slugify(input.slug || input.title) || `program-${Date.now().toString(36)}`;
    let slug = baseSlug;

    for (let attempt = 2; attempt < 100; attempt += 1) {
      const { data: existing, error: lookupError } = await db
        .from('programs')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (!existing) break;
      slug = `${baseSlug}-${attempt}`;
    }

    const now = new Date().toISOString();
    const payload: Record<string, unknown> = {
      title: input.title,
      name: input.name || input.title,
      slug,
      code: input.code || slug.toUpperCase().replace(/-/g, '_'),
      status: input.status,
      category: input.category ?? null,
      updated_at: now,
    };
    if (input.funding_eligible !== undefined) payload.funding_eligible = input.funding_eligible;
    if (input.duration_weeks !== undefined) payload.duration_weeks = input.duration_weeks;
    if (input.total_hours !== undefined) payload.total_hours = input.total_hours;

    const { data, error } = await db.from('programs').insert(payload).select('*').single();
    if (error) throw error;

    await logAdminAudit({
      action: AdminAction.COURSE_SEED_RUN,
      actorId: auth.id,
      entityType: 'programs',
      entityId: data.id,
      metadata: { operation: 'program.created_from_course_builder', title: input.title, slug },
      req: request,
    });

    return NextResponse.json({ ok: true, data, program: data }, { status: 201 });
  } catch (error) {
    return safeInternalError(error, 'Failed to create program');
  }
}
