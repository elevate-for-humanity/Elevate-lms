import { NextRequest, NextResponse } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { createClient } from '@/lib/supabase/server';
import { safeError, safeDbError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  const { slug } = await params;
  const db = await createClient();

  // Resolve slug → program id
  const { data: program, error: progErr } = await db
    .from('programs')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (progErr) return safeDbError(progErr, 'Program lookup failed');
  if (!program) return safeError('Program not found', 404);

  const { data, error } = await db
    .from('program_external_courses')
    .select('id, partner_name, title, external_url, description, duration_display, credential_name, enrollment_instructions, is_required, manual_completion_enabled, sort_order, cost_cents, payer_rule')
    .eq('program_id', program.id)
    .eq('is_active', true)
    .order('sort_order');

  if (error) return safeDbError(error, 'Failed to load external courses');

  return NextResponse.json({ courses: data ?? [] });
}
