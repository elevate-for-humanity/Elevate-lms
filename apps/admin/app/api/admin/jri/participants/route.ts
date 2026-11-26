/**
 * POST /api/admin/jri/participants
 *
 * Form target for /jri/participants/new ("Add Job Ready Indy
 * Participant"). Inserts into jri_participants (user_id / program /
 * enrolled_at / employment_status columns added by migration
 * 20261125130000_jri_participants_fields) and redirects back to the
 * participant list.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const back = (qs: string) =>
    NextResponse.redirect(new URL(`/jri/participants/new?${qs}`, request.url), 303);

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return back('error=unauthorized');

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return back('error=forbidden');
  }

  const form = await request.formData();
  const userId = String(form.get('user_id') ?? '').trim();
  const program = String(form.get('program') ?? '').trim();
  const status = String(form.get('status') ?? 'pending').trim() || 'pending';
  const enrolledRaw = String(form.get('enrolled_at') ?? '').trim();
  const employment = String(form.get('employment_status') ?? '').trim() || null;
  if (!userId || !program) return back('error=missing-fields');

  const { error } = await db.from('jri_participants').insert({
    user_id: userId,
    program,
    status,
    enrolled_at: enrolledRaw ? new Date(enrolledRaw).toISOString() : new Date().toISOString(),
    employment_status: employment,
  });
  if (error) return back('error=save-failed');

  return NextResponse.redirect(new URL('/jri/participants', request.url), 303);
}
