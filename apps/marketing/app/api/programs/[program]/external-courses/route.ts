import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

function isBlockedExternalTraining(course: { partner_name?: string | null; external_url?: string | null }) {
  const provider = String(course.partner_name || '').toLowerCase();
  const url = String(course.external_url || '').toLowerCase();
  return provider.includes('coursera') || url.includes('coursera.org');
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ program: string }> }) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const { program: slug } = await params;
  const db = await createClient();

  const { data: program, error: progErr } = await db
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (progErr) return safeDbError(progErr, 'Program lookup failed');
  if (!program) return safeError('Program not found', 404);

  const { data, error } = await db
    .from('program_external_courses')
    .select(
      'id, partner_name, title, external_url, description, duration_display, credential_name, enrollment_instructions, is_required, manual_completion_enabled, sort_order, cost_cents, payer_rule',
    )
    .eq('program_id', program.id)
    .eq('is_active', true)
    .order('sort_order');

  if (error) return safeDbError(error, 'Failed to load external courses');

  const courses = (data ?? []).filter((course) => !isBlockedExternalTraining(course));
  return NextResponse.json({ courses });
}
