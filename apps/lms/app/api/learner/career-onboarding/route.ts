import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import type { NextRequest } from 'next/server';

export async function GET() {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to open Career Services.' }, { status: 401 });
  const db = await requireAdminClient();
  const { data, error } = await db.from('resume_profiles').select('id').eq('user_id', user.id).maybeSingle();
  if (error) return NextResponse.json({ error: 'Career profile unavailable.' }, { status: 503 });
  return NextResponse.json({ started: Boolean(data) });
}

export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Sign in to start Career Services.' }, { status: 401 });
  const db = await requireAdminClient();
  const { data: enrollment, error: enrollmentError } = await db.from('program_enrollments').select('id')
    .or(`user_id.eq.${user.id},student_id.eq.${user.id}`).is('revoked_at', null).limit(1).maybeSingle();
  if (enrollmentError) return NextResponse.json({ error: 'Enrollment could not be verified.' }, { status: 503 });
  if (!enrollment) return NextResponse.json({ error: 'An enrollment is required to start Career Services.' }, { status: 403 });
  // Existing profiles and employer-visibility preferences are preserved on retries.
  const { error } = await db.from('resume_profiles').upsert({ user_id: user.id }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: 'Career onboarding could not be saved.' }, { status: 500 });
  return NextResponse.json({ started: true });
}
