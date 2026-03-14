/**
 * /api/admin/programs/[programId]/external-courses
 *
 * GET  — list all external partner training items for a program
 * POST — create a new external partner training item
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const ExternalCourseSchema = z.object({
  partner_name:             z.string().min(1, 'Partner name required'),
  title:                    z.string().min(1, 'Title required'),
  external_url:             z.string().url('Must be a valid URL (https://...)'),
  description:              z.string().optional().default(''),
  duration_display:         z.string().optional().default(''),
  credential_type:          z.string().optional().default(''),
  credential_name:          z.string().optional().default(''),
  enrollment_instructions:  z.string().optional().default(''),
  opens_in_new_tab:         z.boolean().default(true),
  is_required:              z.boolean().default(true),
  sort_order:               z.number().int().min(0).default(0),
  manual_completion_enabled: z.boolean().default(true),
  // Competency area — used for proctor-authority guard (replaces keyword matching)
  competency_area:          z.string().optional().nullable(),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = createAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'org_admin', 'staff'].includes(profile.role)) return null;
  return user;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = createAdminClient();
  const { data, error } = await db
    .from('program_external_courses')
    .select('*')
    .eq('program_id', programId)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    logger.error('GET external courses error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params;
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = ExternalCourseSchema.safeParse(body);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    return NextResponse.json({ error: issues }, { status: 422 });
  }

  const db = createAdminClient();

  // Proctor-authority guard: block external attachment if Elevate already holds
  // proctor authority for a credential in the same competency_area.
  // Uses competency_area field (not keyword matching) for reliable enforcement.
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
      return NextResponse.json({
        error: `Elevate holds proctor authority for "${conflict.name}" (${conflict.abbreviation}) ` +
               `in the "${competencyArea}" competency area. ` +
               `Attach an internal LMS course instead of an external partner link for this credential.`,
        conflict_credential: conflict,
      }, { status: 409 });
    }
  }

  const { data, error } = await db
    .from('program_external_courses')
    .insert({ ...parsed.data, program_id: programId, created_by: user.id })
    .select()
    .single();

  if (error) {
    logger.error('POST external course error', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  logger.info('External course created', { programId, title: parsed.data.title, userId: user.id });
  return NextResponse.json({ item: data }, { status: 201 });
}
