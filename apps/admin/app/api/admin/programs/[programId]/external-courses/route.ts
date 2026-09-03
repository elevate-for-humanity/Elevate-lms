/**
 * /api/admin/programs/[programId]/external-courses
 *
 * GET  — list all external partner training items for a program
 * POST — create a new external partner training item
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { z } from 'zod';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isBlockedExternalTraining(course: { partner_name?: string | null; external_url?: string | null }) {
  const provider = String(course.partner_name || '').toLowerCase();
  const url = String(course.external_url || '').toLowerCase();
  return provider.includes('coursera') || url.includes('coursera.org');
}

const ExternalCourseSchema = z.object({
  partner_name: z.string().min(1, 'Partner name required'),
  title: z.string().min(1, 'Title required'),
  external_url: z.string().url('Must be a valid URL (https://...)'),
  description: z.string().optional().default(''),
  duration_display: z.string().optional().default(''),
  credential_type: z.string().optional().default(''),
  credential_name: z.string().optional().default(''),
  enrollment_instructions: z.string().optional().default(''),
  opens_in_new_tab: z.boolean().default(true),
  is_required: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
  manual_completion_enabled: z.boolean().default(true),
  competency_area: z.string().optional().nullable(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const { programId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('program_external_courses')
    .select('*')
    .eq('program_id', programId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    logger.error('GET external courses error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  const items = (data ?? []).filter((course) => !isBlockedExternalTraining(course));
  return NextResponse.json({ items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> },
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const { programId } = await params;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = ExternalCourseSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return NextResponse.json({ error: issues }, { status: 422 });
  }

  if (isBlockedExternalTraining(parsed.data)) {
    return NextResponse.json(
      { error: 'Coursera-linked training is not permitted on the Elevate platform.' },
      { status: 422 },
    );
  }

  const db = await requireAdminClient();
  const competencyArea = parsed.data.competency_area ?? null;

  if (competencyArea) {
    const { data: conflicting } = await db
      .from('credential_registry')
      .select('id, name, abbreviation, competency_area')
      .eq('proctor_authority', 'elevate')
      .eq('competency_area', competencyArea)
      .eq('is_active', true)
      .limit(1);

    const conflict = conflicting?.[0];
    if (conflict) {
      return NextResponse.json(
        {
          error:
            `Elevate holds proctor authority for "${conflict.name}" (${conflict.abbreviation}) ` +
            `in the "${competencyArea}" competency area. ` +
            `Attach an internal LMS course instead of an external partner link for this credential.`,
          conflict_credential: conflict,
        },
        { status: 409 },
      );
    }
  }

  const { data, error } = await db
    .from('program_external_courses')
    .insert({ ...parsed.data, program_id: programId, created_by: auth.id })
    .select()
    .single();

  if (error) {
    logger.error('POST external course error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  logger.info('External course created', { programId, title: parsed.data.title, userId: auth.id });
  return NextResponse.json({ item: data }, { status: 201 });
}
