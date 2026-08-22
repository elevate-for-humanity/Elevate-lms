import type { SupabaseClient } from '@supabase/supabase-js';

export type ParisApplicationDecision = {
  applicationId: string;
  currentStatus: string;
  decidedStatus: string;
  progress: number;
  complete: boolean;
  approved: boolean;
  missing: string[];
  pendingReview: string[];
  completed: string[];
  nextAction: string;
  changed: boolean;
};

const FINAL_STATUSES = new Set(['denied', 'withdrawn', 'closed', 'enrolled']);
const APPROVED_DOCUMENT_STATES = new Set(['approved', 'accepted', 'verified']);

function present(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function normalizeFunding(app: Record<string, any>) {
  return String(app.funding_source || app.requested_funding_source || app.funding_type || '').toLowerCase();
}

function isExternallyFunded(app: Record<string, any>) {
  const value = normalizeFunding(app);
  return ['wioa', 'workone', 'workforce', 'wrp', 'workforce_ready_grant', 'employer', 'sponsor'].some((key) => value.includes(key));
}

export async function evaluateAndAdvanceApplication(
  supabase: SupabaseClient,
  application: Record<string, any>,
  actorId?: string | null,
): Promise<ParisApplicationDecision> {
  const missing: string[] = [];
  const pendingReview: string[] = [];
  const completed: string[] = [];

  const requiredIdentity: Array<[string, string]> = [
    ['first_name', 'First name'],
    ['last_name', 'Last name'],
    ['email', 'Email'],
    ['phone', 'Phone'],
    ['program_id', 'Program selection'],
  ];

  for (const [field, label] of requiredIdentity) {
    if (present(application[field])) completed.push(label);
    else missing.push(label);
  }

  const { data: requirements } = await supabase
    .from('document_requirements')
    .select('id, document_type, name, required, is_required, due_stage')
    .or(`program_id.eq.${application.program_id},program_id.is.null`)
    .eq('role', 'student');

  const requiredDocuments = (requirements || []).filter((row: any) => row.required !== false && row.is_required !== false);
  const { data: documents } = await supabase
    .from('documents')
    .select('id, document_type, requirement_id, status, verification_status, verified, reviewed_at, verified_at')
    .eq('application_id', application.id);

  for (const req of requiredDocuments) {
    const doc = (documents || []).find((candidate: any) =>
      candidate.requirement_id === req.id || candidate.document_type === req.document_type,
    );
    const label = req.name || req.document_type;
    if (!doc) {
      missing.push(`${label} document`);
      continue;
    }
    const accepted = doc.verified === true || APPROVED_DOCUMENT_STATES.has(String(doc.verification_status || '').toLowerCase()) || APPROVED_DOCUMENT_STATES.has(String(doc.status || '').toLowerCase());
    if (accepted) completed.push(`${label} document`);
    else pendingReview.push(`${label} document review`);
  }

  const { data: signatures } = await supabase
    .from('signatures')
    .select('id, status, signed_at, document_type')
    .eq('user_id', application.user_id)
    .not('signed_at', 'is', null);

  if ((signatures || []).length > 0) completed.push('Required signature');
  else missing.push('Required signature');

  const funding = normalizeFunding(application);
  if (!funding) {
    missing.push('Funding or payment pathway');
  } else if (isExternallyFunded(application)) {
    if (application.funding_verified === true || application.has_workone_approval === true) {
      completed.push('Funding authorization');
    } else {
      pendingReview.push('External funding authorization');
    }
  } else {
    completed.push('Funding or payment pathway');
  }

  const claimedHours = Number(application.transfer_hours_claimed || 0);
  if (claimedHours > 0) {
    const verifiedHours = Number(application.transfer_hours_verified || 0);
    if (application.transfer_hours_verified_at && verifiedHours >= 0) completed.push('Transfer hours verification');
    else pendingReview.push('Transfer hours sponsor verification');
  }

  const total = Math.max(1, completed.length + missing.length + pendingReview.length);
  const progress = Math.round((completed.length / total) * 100);
  const complete = missing.length === 0 && pendingReview.length === 0;

  let decidedStatus = String(application.status || 'started');
  if (!FINAL_STATUSES.has(decidedStatus)) {
    if (missing.some((item) => item.toLowerCase().includes('document'))) decidedStatus = 'awaiting_documents';
    else if (missing.length > 0) decidedStatus = 'in_progress';
    else if (pendingReview.length > 0) decidedStatus = 'under_review';
    else decidedStatus = 'approved';
  }

  const changed = decidedStatus !== application.status;
  if (changed) {
    const now = new Date().toISOString();
    const metadata = {
      ...(application.metadata || {}),
      paris: {
        ...((application.metadata || {}).paris || {}),
        last_evaluated_at: now,
        progress,
        missing,
        pending_review: pendingReview,
        decision: decidedStatus,
      },
    };

    await supabase
      .from('applications')
      .update({ status: decidedStatus, metadata, updated_at: now })
      .eq('id', application.id);

    await supabase.from('application_state_events').insert({
      application_type: application.application_type || 'student',
      application_id: application.id,
      from_state: application.status || null,
      to_state: decidedStatus,
      actor_id: actorId || null,
      actor_role: 'paris',
      reason: 'PARIS self-service requirements evaluation',
      metadata: { progress, missing, pendingReview, source: 'paris_self_service' },
    });
  }

  const nextAction = missing[0]
    ? `Complete: ${missing[0]}`
    : pendingReview[0]
      ? `Waiting for: ${pendingReview[0]}`
      : decidedStatus === 'approved'
        ? 'Application requirements are satisfied. Continue to enrollment.'
        : 'Continue application.';

  return {
    applicationId: application.id,
    currentStatus: String(application.status || 'started'),
    decidedStatus,
    progress,
    complete,
    approved: decidedStatus === 'approved',
    missing,
    pendingReview,
    completed,
    nextAction,
    changed,
  };
}

export async function getCurrentApplicantApplication(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from('applications')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}
