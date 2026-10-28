import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  jobReadyModule,
  jobReadyProgress,
  jobReadyStatus,
  scormSeconds,
} from '@/lib/career/job-ready';

export async function POST(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const origin = request.headers.get('origin');
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Sign in again to save your progress.' }, { status: 401 });
  const limited = await applyRateLimit(request, 'api', { key: `job-ready:${user.id}` });
  if (limited) return limited;
  const lesson = jobReadyModule((await context.params).slug);
  if (!lesson) return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
  const text = await request.text();
  if (text.length > 100_000)
    return NextResponse.json({ error: 'Progress record is too large.' }, { status: 413 });
  let cmi: Record<string, string>;
  try {
    const body = JSON.parse(text);
    if (!body.cmi || typeof body.cmi !== 'object' || Array.isArray(body.cmi)) throw new Error();
    const entries = Object.entries(body.cmi);
    if (
      entries.length > 1000 ||
      entries.some(
        ([key, value]) =>
          !/^cmi\.[\w.]+$/.test(key) || typeof value !== 'string' || value.length > 65_536,
      )
    )
      throw new Error();
    cmi = Object.fromEntries(entries) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: 'Invalid learning progress.' }, { status: 400 });
  }
  // Identity and package ID always come from the session and fixed catalog.
  // The client cannot award a credential or complete the technical program.
  const { data: pkg, error: packageError } = await db
    .from('scorm_packages')
    .select('id')
    .eq('id', lesson.id)
    .eq('active', true)
    .maybeSingle();
  if (packageError || !pkg)
    return NextResponse.json(
      { error: 'This lesson is temporarily unavailable. Your current session remains open.' },
      { status: 503 },
    );
  const { data: existing, error: readError } = await db
    .from('scorm_enrollments')
    .select('status')
    .eq('user_id', user.id)
    .eq('scorm_package_id', lesson.id)
    .maybeSingle();
  if (readError)
    return NextResponse.json(
      { error: 'Saved progress could not be read. Please retry.' },
      { status: 503 },
    );
  // Reviewing a finished lesson must never erase its completion record.
  if (existing?.status === 'completed' || existing?.status === 'passed')
    return NextResponse.json({ saved: true });
  const now = new Date().toISOString();
  const status = jobReadyStatus(cmi);
  const score = Number(cmi['cmi.score.raw']);
  const { error: insertError } = await db.from('scorm_enrollments').upsert(
    {
      user_id: user.id,
      scorm_package_id: lesson.id,
      status: 'not_attempted',
    },
    { onConflict: 'scorm_package_id,user_id', ignoreDuplicates: true },
  );
  if (insertError)
    return NextResponse.json(
      { error: 'Progress could not be saved. Please retry.' },
      { status: 503 },
    );
  const { error } = await db
    .from('scorm_enrollments')
    .update({
      status,
      progress_percentage: jobReadyProgress(cmi),
      cmi_data: cmi,
      score: Number.isFinite(score) && cmi['cmi.score.raw'] !== undefined ? score : null,
      time_spent_seconds: Math.round(scormSeconds(cmi['cmi.total_time'])),
      last_accessed_at: now,
      updated_at: now,
      ...(status === 'completed' ? { completed_at: now } : {}),
    })
    .eq('user_id', user.id)
    .eq('scorm_package_id', lesson.id)
    .not('status', 'in', '(completed,passed)');
  if (error)
    return NextResponse.json(
      { error: 'Progress could not be saved. Keep this page open and retry.' },
      { status: 503 },
    );
  return NextResponse.json({ saved: true });
}
