/**
 * Payment + Enrollment Reconciliation Audit
 * Runs against live Stripe + live Supabase.
 * Outputs a structured report: mismatches, gaps, repair candidates.
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY is required'); process.exit(1); }

// Pull Stripe key from app_secrets via service role
const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getStripeKey() {
  const { data, error } = await db
    .from('app_secrets')
    .select('value')
    .eq('key', 'STRIPE_SECRET_KEY')
    .single();
  if (error || !data) throw new Error('Cannot load STRIPE_SECRET_KEY from app_secrets');
  return data.value;
}

// ── STRIPE ────────────────────────────────────────────────────────────────────

async function fetchAllPaidSessions(stripe) {
  const sessions = [];
  let hasMore = true;
  let starting_after;

  while (hasMore) {
    const res = await stripe.checkout.sessions.list({
      limit: 100,
      starting_after,
      expand: ['data.payment_intent'],
    });
    sessions.push(...res.data);
    hasMore = res.has_more;
    if (hasMore) starting_after = res.data[res.data.length - 1].id;
  }

  return sessions
    .filter(s => s.payment_status === 'paid' && s.mode !== 'setup')
    .map(s => ({
      session_id: s.id,
      email: s.customer_details?.email ?? null,
      amount_cents: s.amount_total ?? 0,
      created: s.created,
      created_iso: new Date(s.created * 1000).toISOString(),
      application_id: s.metadata?.application_id ?? null,
      program_slug: s.metadata?.program_slug ?? null,
      student_id: s.metadata?.student_id ?? null,
      user_id: s.metadata?.user_id ?? null,
      kind: s.metadata?.kind ?? null,
      payment_intent_id: typeof s.payment_intent === 'string'
        ? s.payment_intent
        : s.payment_intent?.id ?? null,
      metadata_keys: Object.keys(s.metadata ?? {}),
    }));
}

// ── DB ────────────────────────────────────────────────────────────────────────

async function fetchEnrollments() {
  const { data, error } = await db
    .from('program_enrollments')
    .select('id,user_id,student_id,program_slug,program_id,enrollment_state,payment_status,stripe_checkout_session_id,stripe_payment_intent_id,created_at,funding_source');
  if (error) throw error;
  return data ?? [];
}

async function fetchStudentEnrollments() {
  const { data, error } = await db
    .from('student_enrollments')
    .select('id,student_id,program_id,program_slug,stripe_checkout_session_id,payment_status,enrollment_state,status,created_at,funding_source');
  if (error) throw error;
  return data ?? [];
}

async function fetchApplications() {
  const { data, error } = await db
    .from('applications')
    .select('id,user_id,program_slug,status,payment_status,payment_provider,payment_reference,payment_completed_at,funding_type,funding_verified');
  if (error) throw error;
  return data ?? [];
}

async function fetchApplicationFinancials() {
  const { data, error } = await db
    .from('application_financials')
    .select('id,application_id,payment_status,verification_status,funding_source,funding_approved');
  if (error) throw error;
  return data ?? [];
}

async function fetchWebhookEvents() {
  const { data, error } = await db
    .from('stripe_webhook_events')
    .select('id,stripe_event_id,event_type,status,created_at')
    .eq('event_type', 'checkout.session.completed')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── AUDIT LOGIC ───────────────────────────────────────────────────────────────

function auditA_PaidNotEnrolled(sessions, enrollments, studentEnrollments) {
  // Build lookup sets
  const enrolledBySession = new Set(
    [...enrollments, ...studentEnrollments]
      .map(e => e.stripe_checkout_session_id)
      .filter(Boolean)
  );
  const enrolledByPI = new Set(
    enrollments.map(e => e.stripe_payment_intent_id).filter(Boolean)
  );
  const enrolledBySlugUser = new Set(
    enrollments.map(e => `${e.program_slug}::${e.user_id ?? e.student_id}`).filter(s => !s.includes('null'))
  );

  const missing = sessions.filter(s => {
    const bySession = enrolledBySession.has(s.session_id);
    const byPI = s.payment_intent_id && enrolledByPI.has(s.payment_intent_id);
    const bySlugUser = s.program_slug && (s.user_id || s.student_id) &&
      enrolledBySlugUser.has(`${s.program_slug}::${s.user_id ?? s.student_id}`);
    return !bySession && !byPI && !bySlugUser;
  });

  return missing;
}

function auditB_EnrolledNotPaid(enrollments, sessions, financials, applications) {
  const paidSessions = new Set(sessions.map(s => s.session_id));
  const paidPIs = new Set(sessions.map(s => s.payment_intent_id).filter(Boolean));
  const verifiedFinancials = new Set(
    financials.filter(f => f.verification_status === 'verified').map(f => f.application_id)
  );
  const verifiedApps = new Set(
    applications.filter(a => a.funding_verified === true).map(a => a.id)
  );

  return enrollments.filter(e => {
    const paidBySession = e.stripe_checkout_session_id && paidSessions.has(e.stripe_checkout_session_id);
    const paidByPI = e.stripe_payment_intent_id && paidPIs.has(e.stripe_payment_intent_id);
    const isFunded = e.funding_source && !['SELF_PAY', 'self_pay', null].includes(e.funding_source);
    // Check if there's a verified financial record for this user
    const hasVerifiedFunding = [...verifiedFinancials].some(appId => {
      const app = applications.find(a => a.id === appId);
      return app && (app.user_id === e.user_id || app.user_id === e.student_id);
    });
    const isActive = ['active', 'enrolled', 'approved'].includes(e.enrollment_state ?? e.status ?? '');
    return isActive && !paidBySession && !paidByPI && !isFunded && !hasVerifiedFunding;
  });
}

function auditC_WebhookNotProcessed(webhookEvents, enrollments) {
  // Webhook events for checkout.session.completed that have no corresponding enrollment
  // created within 5 minutes after the event
  return webhookEvents.filter(evt => {
    const evtTime = new Date(evt.created_at).getTime();
    const hasEnrollment = enrollments.some(e => {
      const enrollTime = new Date(e.created_at).getTime();
      return enrollTime >= evtTime - 60000 && enrollTime <= evtTime + 300000;
    });
    return !hasEnrollment && evt.status !== 'duplicate';
  });
}

function auditD_BNPLGaps(enrollments, financials, applications) {
  const verifiedFinancials = new Set(
    financials.filter(f => f.verification_status === 'verified').map(f => f.application_id)
  );

  return enrollments.filter(e => {
    const isBNPL = e.funding_source && !['SELF_PAY', 'self_pay'].includes(e.funding_source)
      && !e.stripe_checkout_session_id && !e.stripe_payment_intent_id;
    if (!isBNPL) return false;
    const isActive = ['active', 'enrolled', 'approved'].includes(e.enrollment_state ?? '');
    if (!isActive) return false;
    // Check if funding is actually verified
    const app = applications.find(a =>
      (a.user_id === e.user_id || a.user_id === e.student_id) &&
      a.program_slug === e.program_slug
    );
    if (!app) return true; // no app = definitely unverified
    return !verifiedFinancials.has(app.id);
  });
}

function auditMetadata(sessions) {
  const missing_application_id = sessions.filter(s => !s.application_id && s.kind === 'program_enrollment');
  const missing_program_slug = sessions.filter(s => !s.program_slug && s.kind === 'program_enrollment');
  const missing_user_id = sessions.filter(s => !s.user_id && !s.student_id && s.kind === 'program_enrollment');
  const no_kind = sessions.filter(s => !s.kind);
  return { missing_application_id, missing_program_slug, missing_user_id, no_kind };
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(70));
  console.log('PAYMENT + ENROLLMENT RECONCILIATION AUDIT');
  console.log(new Date().toISOString());
  console.log('='.repeat(70));

  console.log('\n[1/7] Loading Stripe secret key...');
  const stripeKey = await getStripeKey();
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });

  console.log('[2/7] Fetching all paid Stripe sessions...');
  const sessions = await fetchAllPaidSessions(stripe);
  console.log(`      → ${sessions.length} paid sessions total`);

  console.log('[3/7] Fetching DB state...');
  const [enrollments, studentEnrollments, applications, financials, webhookEvents] = await Promise.all([
    fetchEnrollments(),
    fetchStudentEnrollments(),
    fetchApplications(),
    fetchApplicationFinancials(),
    fetchWebhookEvents(),
  ]);
  console.log(`      → program_enrollments: ${enrollments.length}`);
  console.log(`      → student_enrollments: ${studentEnrollments.length}`);
  console.log(`      → applications: ${applications.length}`);
  console.log(`      → application_financials: ${financials.length}`);
  console.log(`      → checkout webhook events: ${webhookEvents.length}`);

  console.log('\n[4/7] Running audits...');

  // Audit A
  const auditA = auditA_PaidNotEnrolled(sessions, enrollments, studentEnrollments);
  // Audit B
  const auditB = auditB_EnrolledNotPaid(enrollments, sessions, financials, applications);
  // Audit C
  const auditC = auditC_WebhookNotProcessed(webhookEvents, enrollments);
  // Audit D
  const auditD = auditD_BNPLGaps(enrollments, financials, applications);
  // Metadata
  const meta = auditMetadata(sessions);

  // ── REPORT ──────────────────────────────────────────────────────────────────

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT A — PAID BUT NOT ENROLLED (highest risk)');
  console.log('='.repeat(70));
  if (auditA.length === 0) {
    console.log('✅ ZERO mismatches. Every paid session has an enrollment.');
  } else {
    console.log(`❌ ${auditA.length} sessions paid but NO enrollment found:\n`);
    for (const s of auditA) {
      console.log(`  session: ${s.session_id}`);
      console.log(`  email:   ${s.email}`);
      console.log(`  amount:  $${(s.amount_cents / 100).toFixed(2)}`);
      console.log(`  date:    ${s.created_iso}`);
      console.log(`  slug:    ${s.program_slug ?? '(none)'}`);
      console.log(`  app_id:  ${s.application_id ?? '(none)'}`);
      console.log(`  user_id: ${s.user_id ?? s.student_id ?? '(none)'}`);
      console.log(`  kind:    ${s.kind ?? '(none)'}`);
      console.log(`  meta:    [${s.metadata_keys.join(', ')}]`);
      console.log('  ---');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT B — ENROLLED BUT NOT PAID / NOT FUNDED');
  console.log('='.repeat(70));
  if (auditB.length === 0) {
    console.log('✅ ZERO mismatches. Every active enrollment has payment or verified funding.');
  } else {
    console.log(`❌ ${auditB.length} active enrollments with no payment evidence:\n`);
    for (const e of auditB) {
      console.log(`  enrollment: ${e.id}`);
      console.log(`  user_id:    ${e.user_id ?? e.student_id}`);
      console.log(`  slug:       ${e.program_slug}`);
      console.log(`  state:      ${e.enrollment_state}`);
      console.log(`  funding:    ${e.funding_source}`);
      console.log(`  created:    ${e.created_at}`);
      console.log('  ---');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT C — WEBHOOK RECEIVED BUT ENROLLMENT MISSING');
  console.log('='.repeat(70));
  if (auditC.length === 0) {
    console.log('✅ All checkout webhook events have corresponding enrollments.');
  } else {
    console.log(`⚠️  ${auditC.length} checkout webhook events with no nearby enrollment:\n`);
    for (const w of auditC) {
      console.log(`  event_id: ${w.stripe_event_id}`);
      console.log(`  status:   ${w.status}`);
      console.log(`  created:  ${w.created_at}`);
      console.log('  ---');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT D — BNPL/FUNDING GAPS (active without verified funding)');
  console.log('='.repeat(70));
  if (auditD.length === 0) {
    console.log('✅ No active BNPL enrollments with unverified funding.');
  } else {
    console.log(`❌ ${auditD.length} BNPL enrollments active without verified funding:\n`);
    for (const e of auditD) {
      console.log(`  enrollment: ${e.id}`);
      console.log(`  user_id:    ${e.user_id ?? e.student_id}`);
      console.log(`  slug:       ${e.program_slug}`);
      console.log(`  funding:    ${e.funding_source}`);
      console.log('  ---');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('METADATA AUDIT — STRIPE SESSION METADATA COMPLETENESS');
  console.log('='.repeat(70));
  const programSessions = sessions.filter(s => s.kind === 'program_enrollment');
  console.log(`  Total paid sessions:              ${sessions.length}`);
  console.log(`  program_enrollment kind:          ${programSessions.length}`);
  console.log(`  No kind at all:                   ${meta.no_kind.length}`);
  console.log(`  Missing application_id (program): ${meta.missing_application_id.length}`);
  console.log(`  Missing program_slug (program):   ${meta.missing_program_slug.length}`);
  console.log(`  Missing user_id (program):        ${meta.missing_user_id.length}`);

  if (meta.no_kind.length > 0) {
    console.log('\n  Sessions with no kind metadata (sample, max 5):');
    for (const s of meta.no_kind.slice(0, 5)) {
      console.log(`    ${s.session_id} | ${s.email} | $${(s.amount_cents/100).toFixed(2)} | ${s.created_iso} | meta:[${s.metadata_keys.join(',')}]`);
    }
  }

  // ── REPAIR CANDIDATES ──────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log('REPAIR CANDIDATES (Audit A with application_id — can auto-repair)');
  console.log('='.repeat(70));
  const repairable = auditA.filter(s => s.application_id && s.program_slug);
  const needsManual = auditA.filter(s => !s.application_id || !s.program_slug);
  console.log(`  Auto-repairable (have application_id + slug): ${repairable.length}`);
  console.log(`  Needs manual review (missing metadata):       ${needsManual.length}`);

  if (repairable.length > 0) {
    console.log('\n  Repairable sessions:');
    for (const s of repairable) {
      console.log(`    ${s.session_id} | app:${s.application_id} | slug:${s.program_slug} | ${s.email}`);
    }
  }

  // ── SUMMARY ────────────────────────────────────────────────────────────────
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  const critical = auditA.length + auditB.length;
  console.log(`  A. Paid not enrolled:          ${auditA.length}  ${auditA.length > 0 ? '❌ CRITICAL' : '✅'}`);
  console.log(`  B. Enrolled not paid:          ${auditB.length}  ${auditB.length > 0 ? '❌ CRITICAL' : '✅'}`);
  console.log(`  C. Webhook not processed:      ${auditC.length}  ${auditC.length > 0 ? '⚠️  REVIEW' : '✅'}`);
  console.log(`  D. BNPL unverified active:     ${auditD.length}  ${auditD.length > 0 ? '❌ CRITICAL' : '✅'}`);
  console.log(`  Metadata gaps (program kind):  ${meta.missing_application_id.length} missing app_id`);
  console.log('');
  if (critical === 0 && auditD.length === 0) {
    console.log('  ✅ System is clean. No repair needed.');
  } else {
    console.log(`  ❌ ${critical + auditD.length} critical issues require action.`);
    if (repairable.length > 0) {
      console.log(`  → Run with --repair flag to auto-repair ${repairable.length} session(s).`);
    }
  }

  // ── REPAIR ────────────────────────────────────────────────────────────────
  if (process.argv.includes('--repair') && repairable.length > 0) {
    console.log('\n' + '='.repeat(70));
    console.log('REPAIR MODE — triggering enrollment for repairable sessions');
    console.log('='.repeat(70));
    for (const s of repairable) {
      console.log(`\nRepairing: ${s.session_id}`);
      // Look up user_id from application
      const { data: app } = await db
        .from('applications')
        .select('id,user_id,program_slug,status')
        .eq('id', s.application_id)
        .single();

      if (!app) {
        console.log(`  ⚠️  application ${s.application_id} not found in DB — skipping`);
        continue;
      }
      if (!app.user_id) {
        console.log(`  ⚠️  application has no user_id — skipping (manual review needed)`);
        continue;
      }

      // Check again — idempotency guard
      const { data: existing } = await db
        .from('program_enrollments')
        .select('id')
        .eq('stripe_checkout_session_id', s.session_id)
        .maybeSingle();

      if (existing) {
        console.log(`  ✅ Already enrolled (race condition resolved) — skipping`);
        continue;
      }

      // Upsert enrollment — same logic as webhook handler
      const { data: enrollment, error: enrollErr } = await db
        .from('program_enrollments')
        .upsert({
          student_id: app.user_id,
          user_id: app.user_id,
          program_slug: s.program_slug,
          stripe_checkout_session_id: s.session_id,
          stripe_payment_intent_id: s.payment_intent_id,
          amount_paid_cents: s.amount_cents,
          funding_source: 'self_pay',
          enrollment_state: 'active',
          payment_status: 'paid',
          paid_at: new Date(s.created * 1000).toISOString(),
          source: 'stripe_reconciliation_repair',
        }, {
          onConflict: 'stripe_checkout_session_id',
          ignoreDuplicates: true,
        })
        .select('id')
        .single();

      if (enrollErr) {
        console.log(`  ❌ Repair failed: ${enrollErr.message}`);
      } else {
        console.log(`  ✅ Enrollment created: ${enrollment?.id}`);
        // Update application status
        await db
          .from('applications')
          .update({ status: 'enrolled', payment_status: 'paid', payment_completed_at: new Date(s.created * 1000).toISOString() })
          .eq('id', s.application_id);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('AUDIT COMPLETE');
  console.log('='.repeat(70));

  // Exit with error code if critical issues found
  if (auditA.length > 0 || auditB.length > 0 || auditD.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(2);
});
