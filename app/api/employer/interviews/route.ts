import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

const scheduleSchema = z.object({
  candidate_id:   z.string().uuid(),
  job_id:         z.string().uuid().optional(),
  scheduled_at:   z.string().datetime(),
  interview_type: z.enum(['phone','video','in_person','panel']).default('video'),
  duration_mins:  z.number().int().min(15).max(240).default(30),
  location:       z.string().max(500).optional(),
  meeting_url:    z.string().url().optional(),
  notes:          z.string().max(2000).optional(),
  position:       z.string().max(200).optional(),
});

// GET /api/employer/interviews — list interviews for authenticated employer
export async function GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

  let query = supabase
    .from('interviews')
    .select('*, candidate:candidate_id(id, full_name, email, avatar_url)')
    .eq('employer_id', user.id)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return safeDbError(error, 'Failed to fetch interviews');

  return NextResponse.json({ interviews: data ?? [] });
}

// POST /api/employer/interviews — schedule a new interview
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  // Verify employer role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['employer', 'admin', 'staff'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  let body: unknown;
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) return safeError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      ...parsed.data,
      employer_id: user.id,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to schedule interview');

  logger.info('Interview scheduled', { interviewId: data.id, employerId: user.id, candidateId: parsed.data.candidate_id });

  return NextResponse.json({ interview: data }, { status: 201 });
}

// PATCH /api/employer/interviews — update interview status/details
export async function PATCH(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  let body: unknown;
  try { body = await request.json(); } catch { return safeError('Invalid JSON', 400); }

  const { id, ...updates } = body as Record<string, unknown>;
  if (!id || typeof id !== 'string') return safeError('Interview ID required', 400);

  const allowed = ['status','notes','scheduled_at','location','meeting_url','outcome','duration_mins'];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase
    .from('interviews')
    .update({ ...filtered, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('employer_id', user.id) // RLS + explicit filter
    .select()
    .single();

  if (error) return safeDbError(error, 'Failed to update interview');
  if (!data) return safeError('Interview not found', 404);

  return NextResponse.json({ interview: data });
}
