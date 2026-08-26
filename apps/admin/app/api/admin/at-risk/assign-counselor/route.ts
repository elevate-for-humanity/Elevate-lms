export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const riskId = typeof body.riskId === 'string' ? body.riskId : null;
  const reason = typeof body.reason === 'string' && body.reason.trim()
    ? body.reason.trim().slice(0, 1000)
    : 'Learner requires proactive student-success follow-up.';
  if (!userId) return safeError('userId required', 400);

  const db = await requireAdminClient();
  const { data: learner, error: learnerError } = await db
    .from('profiles')
    .select('id, full_name, email')
    .eq('id', userId)
    .maybeSingle();
  if (learnerError) return safeInternalError(learnerError, 'Failed to load learner');
  if (!learner) return safeError('Learner not found', 404);

  const notes = `AI-supported counselor intervention: ${reason}`;
  const { data: existing, error: existingError } = await db
    .from('student_interventions')
    .select('id, status, due_at')
    .eq('user_id', userId)
    .eq('intervention_type', 'other')
    .in('status', ['pending', 'in_progress'])
    .ilike('notes', 'AI-supported counselor intervention:%')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) return safeInternalError(existingError, 'Failed to check counselor assignment');

  if (existing) {
    return NextResponse.json({
      ok: true,
      intervention: existing,
      learner: { id: learner.id, name: learner.full_name, email: learner.email },
      alreadyAssigned: true,
    });
  }

  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { data: intervention, error: insertError } = await db
    .from('student_interventions')
    .insert({
      user_id: userId,
      at_risk_id: riskId,
      intervention_type: 'other',
      status: 'in_progress',
      notes,
      due_at: dueAt,
      created_by: auth.id,
    })
    .select('id, status, due_at')
    .single();
  if (insertError) return safeInternalError(insertError, 'Failed to assign AI counselor');

  return NextResponse.json({
    ok: true,
    intervention,
    learner: { id: learner.id, name: learner.full_name, email: learner.email },
    alreadyAssigned: false,
  });
}
