import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Base steps every student goes through regardless of funding source
const BASE_STEPS = [
  { key: 'efh_inquiry',          label: 'Submit Elevate for Humanity application' },
  { key: 'icc_account',          label: 'Create IndianaCareerConnect account' },
  { key: 'workone_appt_booked',  label: 'Book WorkOne appointment (tell them you\'re here for Elevate for Humanity)' },
  { key: 'attend_appt',          label: 'Attend WorkOne appointment' },
  { key: 'confirm_pathway',      label: 'Confirm funding pathway with WorkOne counselor' },
  { key: 'upload_docs',          label: 'Upload eligibility documents if requested by WorkOne' },
  { key: 'get_approval',         label: 'Receive WorkOne approval letter or authorization code' },
  { key: 'call_efh_back',        label: 'Contact Elevate with your approval to activate enrollment' },
  { key: 'enrollment_final',     label: 'Elevate enrollment activated' },
];

// Extra steps per funding source
const FUNDING_EXTRA_STEPS: Record<string, { key: string; label: string }[]> = {
  workone: [
    { key: 'wioa_eligibility',   label: 'WorkOne confirms WIOA Title I eligibility' },
    { key: 'iep_created',        label: 'Individual Employment Plan (IEP) created with WorkOne' },
  ],
  workforce_ready_grant: [
    { key: 'wrg_eligibility',    label: 'WorkOne confirms Workforce Ready Grant eligibility' },
    { key: 'wrg_authorization',  label: 'Receive Workforce Ready Grant authorization' },
  ],
  jri: [
    { key: 'jri_case_manager',   label: 'Connect with JRI case manager or reentry coordinator' },
    { key: 'jri_docs',           label: 'Provide justice-involved documentation to Elevate' },
    { key: 'jri_approval',       label: 'JRI funding confirmed by Elevate' },
  ],
  employer_sponsored: [
    { key: 'employer_agreement', label: 'Employer signs sponsorship agreement with Elevate' },
    { key: 'employer_invoice',   label: 'Employer receives and pays invoice' },
  ],
  partner: [
    { key: 'partner_seat',       label: 'Elevate confirms partner-funded seat availability' },
    { key: 'partner_approval',   label: 'Partner funding confirmed' },
  ],
  self_pay: [
    { key: 'payment_plan',       label: 'Confirm payment plan or tuition payment with Elevate' },
  ],
};

function stepsForFundingSource(fundingSource: string) {
  const extra = FUNDING_EXTRA_STEPS[fundingSource] ?? FUNDING_EXTRA_STEPS['self_pay'];
  // Insert funding-specific steps after 'confirm_pathway' (index 4)
  const steps = [...BASE_STEPS];
  steps.splice(5, 0, ...extra);
  return steps;
}

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const adminClient = createAdminClient();
  const body = await req.json().catch(() => ({}));
  const targetUserId: string = body.user_id || user.id;

  // Only allow seeding for self unless admin
  if (targetUserId !== user.id) {
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const adminRoles = ['admin', 'super_admin', 'staff'];
    if (!profile || !adminRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Determine funding source — use passed value, fall back to application record
  let fundingSource: string = body.funding_source || 'self_pay';
  if (!body.funding_source) {
    const { data: app } = await adminClient
      .from('applications')
      .select('requested_funding_source')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (app?.requested_funding_source) {
      fundingSource = app.requested_funding_source;
    }
  }

  const steps = stepsForFundingSource(fundingSource);

  // Get organization_id if available (optional — students may not have one)
  const { data: profile } = await adminClient
    .from('profiles')
    .select('organization_id')
    .eq('id', targetUserId)
    .maybeSingle();

  const inserts = steps.map((s, i) => ({
    organization_id: profile?.organization_id ?? null,
    user_id:         targetUserId,
    step_key:        s.key,
    step_label:      s.label,
    status:          'todo',
    sort_order:      i,
  }));

  const { error } = await adminClient
    .from('workone_checklist')
    .upsert(inserts, { onConflict: 'user_id,step_key', ignoreDuplicates: true });

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, funding_source: fundingSource, steps: steps.length });
}

export const POST = withApiAudit('/api/workone/seed', _POST);
