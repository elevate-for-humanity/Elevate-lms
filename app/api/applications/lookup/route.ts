// PUBLIC ROUTE: look up an existing application by email + program
// Used when a returning applicant tries to pay but already has an application on file.

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

async function findApplication(
  db: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>,
  email: string,
  program: string,
) {
  const programFilter = `program_slug.eq.${program},program_interest.eq.${program}`;

  const byNormalized = await db
    .from('applications')
    .select('id, status, intake_stage, created_at')
    .eq('normalized_email', email)
    .or(programFilter)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (byNormalized.data) return byNormalized.data;
  if (byNormalized.error && (byNormalized.error as { code?: string }).code !== '42703') {
    return null;
  }

  const byEmail = await db
    .from('applications')
    .select('id, status, intake_stage, created_at')
    .ilike('email', email)
    .or(programFilter)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return byEmail.data ?? null;
}

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  const url = new URL(request.url);
  const email = url.searchParams.get('email')?.toLowerCase().trim();
  const program = url.searchParams.get('program')?.trim();

  if (!email || !program) {
    return NextResponse.json({ error: 'email and program required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const data = await findApplication(db, email, program);

  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ id: data.id, status: data.status, intake_stage: data.intake_stage });
}
