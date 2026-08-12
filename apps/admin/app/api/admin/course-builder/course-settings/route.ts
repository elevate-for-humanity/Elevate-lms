import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { COMPLIANCE_PROFILES } from '@/lib/course-builder/compliance-profiles';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SettingsSchema = z.object({
  courseId: z.string().uuid(),
  title: z.string().trim().min(1).max(250).optional(),
  description: z.string().max(20000).nullable().optional(),
  programId: z.string().uuid().nullable().optional(),
  durationHours: z.number().positive().nullable().optional(),
  passingScore: z.number().min(0).max(100).nullable().optional(),
  complianceProfileKey: z.string().min(1).nullable().optional(),
  governingBody: z.string().max(500).nullable().optional(),
  governingRegion: z.string().max(250).nullable().optional(),
  governingStandardVersion: z.string().max(250).nullable().optional(),
});

export async function PATCH(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const parsed = SettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return safeError('Invalid course settings', 400);

  const input = parsed.data;
  if (input.complianceProfileKey && !COMPLIANCE_PROFILES[input.complianceProfileKey]) {
    return safeError('Unknown compliance profile', 400);
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.title !== undefined) update.title = input.title;
  if (input.description !== undefined) update.description = input.description;
  if (input.programId !== undefined) update.program_id = input.programId;
  if (input.durationHours !== undefined) update.duration_hours = input.durationHours;
  if (input.passingScore !== undefined) update.passing_score = input.passingScore;
  if (input.complianceProfileKey !== undefined) update.compliance_profile_key = input.complianceProfileKey;
  if (input.governingBody !== undefined) update.governing_body = input.governingBody;
  if (input.governingRegion !== undefined) update.governing_region = input.governingRegion;
  if (input.governingStandardVersion !== undefined) update.governing_standard_version = input.governingStandardVersion;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('courses')
      .update(update)
      .eq('id', input.courseId)
      .select('id,title,slug,description,status,program_id,duration_hours,passing_score,review_status,compliance_profile_key,governing_body,governing_region,governing_standard_version')
      .maybeSingle();
    if (error) throw error;
    if (!data) return safeError('Course not found', 404);

    await logAdminAudit({
      action: AdminAction.CAREER_COURSE_UPDATED,
      actorId: auth.id,
      entityType: 'courses',
      entityId: input.courseId,
      metadata: { source: 'course_builder_governance', fields: Object.keys(update).filter((key) => key !== 'updated_at') },
      req: request,
    });

    return NextResponse.json({ ok: true, course: data });
  } catch (error) {
    return safeInternalError(error, 'Failed to update course settings');
  }
}
