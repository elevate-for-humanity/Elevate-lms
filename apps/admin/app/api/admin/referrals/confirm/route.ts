import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const dynamic = 'force-dynamic';

interface ConfirmBody {
  referral_id:          string;
  confirmation_type:    string;
  confirmation_method?: string;
  confirmed_by_name?:   string;
  confirmed_by_email?:  string;
  notes?:               string;
  enrollment_date?:     string;
  completion_date?:     string;
  placement_date?:      string;
  employer_name?:       string;
  job_title?:           string;
  hourly_wage?:         number;
  follow_up_required?:  boolean;
  follow_up_due_date?:  string;
}

const VALID_TYPES = [
  'receipt', 'enrollment', 'attendance', 'completion',
  'placement', 'no_show', 'declined', 'unable_to_reach',
] as const;

const VALID_METHODS = ['email', 'phone', 'portal', 'in_person', 'fax', 'other'] as const;

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as ConfirmBody | null;
  if (!body) return safeError('Invalid request body', 400);

  const { referral_id, confirmation_type, notes } = body;

  if (!referral_id) return safeError('referral_id is required', 400);
  if (!confirmation_type || !VALID_TYPES.includes(confirmation_type as (typeof VALID_TYPES)[number])) {
    return safeError(`Invalid confirmation_type: ${confirmation_type}`, 400);
  }
  if (!notes?.trim()) return safeError('Case notes are required for audit compliance', 400);

  const method = body.confirmation_method ?? 'email';
  if (!VALID_METHODS.includes(method as (typeof VALID_METHODS)[number])) {
    return safeError(`Invalid confirmation_method: ${method}`, 400);
  }

  const db = await requireAdminClient();

  // Verify referral exists
  const { data: referral, error: refErr } = await db
    .from('workforce_referrals')
    .select('id, status')
    .eq('id', referral_id)
    .maybeSingle();

  if (refErr) return safeDbError(refErr, 'Referral lookup failed');
  if (!referral) return safeError('Referral not found', 404);

  // Insert confirmation row — the DB trigger handles status advancement
  const { error: insertErr } = await db
    .from('agency_referral_confirmations')
    .insert({
      referral_id,
      confirmation_type,
      confirmation_method:  method,
      confirmed_by_name:    body.confirmed_by_name   ?? null,
      confirmed_by_email:   body.confirmed_by_email  ?? null,
      recorded_by:          auth.id,
      notes:                notes.trim(),
      enrollment_date:      body.enrollment_date     ?? null,
      completion_date:      body.completion_date     ?? null,
      placement_date:       body.placement_date      ?? null,
      employer_name:        body.employer_name       ?? null,
      job_title:            body.job_title           ?? null,
      hourly_wage:          body.hourly_wage         ?? null,
      follow_up_required:   body.follow_up_required  ?? false,
      follow_up_due_date:   body.follow_up_due_date  ?? null,
    });

  if (insertErr) return safeDbError(insertErr, 'Failed to save confirmation');

  return NextResponse.json({ ok: true });
}
