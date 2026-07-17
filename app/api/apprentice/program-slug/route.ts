import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/apprentice/program-slug
 * Returns the authenticated user's active apprenticeship program slug.
 * Used by DocumentsClient and other pages that previously hardcoded 'barber-apprenticeship'.
 */
export async function GET(_req: NextRequest) {
  const rateLimited = await applyRateLimit(_req, 'api');
  if (rateLimited) return rateLimited;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Try apprentices table first (most direct)
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('program_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (apprentice?.program_id) {
    const { data: apprenticeProgram } = await supabase
      .from('programs')
      .select('slug')
      .eq('id', apprentice.program_id)
      .maybeSingle();

    if (apprenticeProgram?.slug) {
      return NextResponse.json({ programSlug: apprenticeProgram.slug });
    }
  }

  // Fallback: program_enrollments
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('program_slug, program_id')
    .eq('user_id', user.id)
    .in('status', ['active', 'enrolled', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let slugFromEnrollment: string | null = enrollment?.program_slug ?? null;
  if (!slugFromEnrollment && enrollment?.program_id) {
    const { data: enrollmentProgram } = await supabase
      .from('programs')
      .select('slug')
      .eq('id', enrollment.program_id)
      .maybeSingle();
    slugFromEnrollment = enrollmentProgram?.slug ?? null;
  }

  return NextResponse.json({ programSlug: slugFromEnrollment });
}
