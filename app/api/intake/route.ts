// PUBLIC ROUTE: public intake form
import { safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import {
  sendApplicationConfirmation,
  sendAdminApplicationNotification,
} from '@/lib/notifications/application-emails';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { normalizeProgramInterest } from '@/lib/intake/normalize-program-interest';
import { resolveZip } from '@/lib/intake/normalize-zip';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// Auto-tag funding eligibility based on intake answers.
// Priority: JRI > self-pay > WIOA categorical > WIOA income > WIOA workforce > pending-review
function determineFundingTag(body: Record<string, string | string[]>): string {
  if (body.probation_or_reentry === 'true') return 'jri';
  if (body.funding_needed === 'false') return 'self-pay';
  // WIOA categorical eligibility: SNAP or TANF receipt
  if (body.snap_recipient === 'true' || body.tanf_recipient === 'true') return 'wioa-categorical';
  // WIOA income eligibility: low-income household
  const incomeRange = typeof body.annual_income === 'string' ? body.annual_income : '';
  if (incomeRange === '0-15000' || incomeRange === '15000-25000') return 'wioa-income';
  // WIOA via workforce partner connection
  if (body.workforce_connection === 'workone' || body.workforce_connection === 'employer-indy')
    return 'wioa';
  return 'pending-review';
}

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const supabase = await requireAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  let body: Record<string, string | string[]>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  const fundingTag = determineFundingTag(body);
  const programInterest = normalizeProgramInterest(body.program_interest as string | undefined);

  // Return undefined instead of null to avoid NOT NULL constraint issues
  // if columns are tightened later. Supabase-js omits undefined fields.
  function clean(v: string | undefined | null, max = 200): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    if (!s) return undefined;
    return s.slice(0, max);
  }

  // Barriers arrive as a string (single value) or string[] (multiple checkboxes)
  const barriersRaw = body.barriers;
  const barriers: string[] = Array.isArray(barriersRaw)
    ? barriersRaw
    : barriersRaw
      ? [barriersRaw as string]
      : [];

  // Document URLs uploaded via /api/intake/upload before form submission
  const documentUrlsRaw = body.document_urls;
  const documentUrls: string[] = Array.isArray(documentUrlsRaw)
    ? documentUrlsRaw.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : typeof documentUrlsRaw === 'string' && documentUrlsRaw
      ? [documentUrlsRaw]
      : [];

  // Non-fatal — apprenticeship_intake is a secondary log table. If it fails
  // (e.g. table not yet applied in this environment) we continue to the canonical
  // applications insert below so the application is never lost.
  const { error } = await supabase.from('apprenticeship_intake').insert([
    {
      full_name: (body.full_name as string).trim(),
      email: clean(body.email as string),
      phone: clean(body.phone as string),
      city: clean(body.city as string),
      state: clean(body.state as string) || 'IN',
      county: clean(body.county as string),
      date_of_birth: clean(body.date_of_birth as string) || null,
      program_interest: clean(programInterest) || 'not-specified',
      employment_status: clean(body.employment_status as string),
      funding_needed: body.funding_needed !== 'false',
      household_size: body.household_size ? parseInt(body.household_size as string, 10) : null,
      annual_income: clean(body.annual_income as string),
      snap_recipient: body.snap_recipient === 'true',
      tanf_recipient: body.tanf_recipient === 'true',
      barriers,
      workforce_connection: clean(body.workforce_connection as string),
      referral_source: clean(body.referral_source as string),
      probation_or_reentry: body.probation_or_reentry === 'true',
      preferred_location: clean(body.preferred_location as string),
      notes: clean(body.notes as string, 1000),
      funding_tag: fundingTag,
      document_urls: documentUrls.length > 0 ? documentUrls : undefined,
    },
  ]);

  if (error) {
    // Log but do not abort — the canonical applications insert below is the source of truth.
    logger.warn('[Intake API] apprenticeship_intake insert failed (non-fatal):', error.message);
  }

  // Mirror into applications table so the admin queue picks it up.
  // apprenticeship_intake retains the full intake detail; applications drives
  // the admin review workflow (status, enroll, inquiry actions).
  const fullName = (body.full_name as string).trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] ?? fullName;
  // applications.last_name is NOT NULL — fall back to first name when only one
  // name token is provided (e.g. "Modupe" with no surname).
  const lastName = nameParts.slice(1).join(' ') || nameParts[0] || fullName;

  const supportNotes = [
    body.employment_status ? `Employment: ${body.employment_status}` : null,
    body.annual_income ? `Income: ${body.annual_income}` : null,
    body.household_size ? `Household: ${body.household_size}` : null,
    body.snap_recipient === 'true' ? 'SNAP: Yes' : null,
    body.tanf_recipient === 'true' ? 'TANF: Yes' : null,
    body.probation_or_reentry === 'true' ? 'Reentry: Yes' : null,
    body.workforce_connection ? `Workforce: ${body.workforce_connection}` : null,
    body.preferred_location ? `Preferred location: ${body.preferred_location}` : null,
    fundingTag ? `Funding tag: ${fundingTag}` : null,
    barriers.length ? `Barriers: ${barriers.join(', ')}` : null,
    documentUrls.length > 0 ? `Documents uploaded: ${documentUrls.length}` : null,
  ].filter(Boolean).join(' | ');

  const zipCode = resolveZip([
    body.zip as string | undefined,
    body.zipcode as string | undefined,
    body.zipCode as string | undefined,
    body.zip_code as string | undefined,
    body.postal_code as string | undefined,
    body.postalCode as string | undefined,
    body['address.zip'] as string | undefined,
  ]);

  // Use maybeSingle() instead of single() — single() throws PGRST116 when RLS
  // silently blocks the SELECT-after-insert and returns 0 rows.
  //
  // Root cause of mirror failures: overlapping RESTRICTIVE SELECT policies on
  // public.applications (applications_own_read, users_own, etc.) were blocking
  // the post-insert SELECT even when using the service_role client, because
  // Supabase evaluates RESTRICTIVE policies on the `public` and `authenticated`
  // roles before checking the service_role PERMISSIVE policy.
  //
  // Fixed by migration: 20260628000003_fix_applications_rls.sql
  // That migration drops all conflicting policies and replaces them with a clean
  // non-overlapping set where service_role has an explicit PERMISSIVE ALL policy.
  const { data: appRow, error: appError } = await supabase
    .from('applications')
    .insert({
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email: clean(body.email as string) ?? '',
      phone: clean(body.phone as string) ?? '',
      city: clean(body.city as string) ?? '',
      zip: zipCode,
      program_interest: clean(programInterest) ?? 'not-specified',
      program_slug: clean(programInterest) ?? null,
      status: 'submitted',
      source: 'intake-form',
      support_notes: supportNotes || null,
      eligibility_data: {
        funding_tag: fundingTag,
        annual_income: body.annual_income,
        household_size: body.household_size,
        snap_recipient: body.snap_recipient === 'true',
        tanf_recipient: body.tanf_recipient === 'true',
        probation_or_reentry: body.probation_or_reentry === 'true',
        employment_status: body.employment_status,
        workforce_connection: body.workforce_connection,
        county: body.county,
        barriers,
        document_urls: documentUrls.length > 0 ? documentUrls : undefined,
      },
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .maybeSingle();

  if (appError) {
    // Mirror failure — intake record is already saved in apprenticeship_intake so
    // the submission is not lost. Log the full error with Postgres code so it's
    // actionable without needing to reproduce.
    //
    // Common codes:
    //   42703 — column does not exist (schema drift)
    //   42501 — insufficient privilege (RLS blocking INSERT — apply 20260628000003)
    //   23502 — not-null violation (required column missing from insert)
    //   23505 — unique violation (duplicate email+program)
    logger.error('[Intake API] Mirror to applications failed', {
      pg_code:  appError.code,
      pg_msg:   appError.message,
      pg_hint:  appError.hint,
      pg_detail: appError.details,
      email:    clean(body.email as string),
      program:  programInterest,
      action:   appError.code === '42501'
        ? 'Apply migration 20260628000003_fix_applications_rls.sql in Supabase Dashboard'
        : appError.code === '42703'
        ? 'Schema drift — column in code does not exist in DB'
        : 'Check Supabase logs for full error',
    });
  } else if (!appRow) {
    // Insert succeeded (no error) but returned no row — RLS blocked the SELECT
    // after insert. The record exists in applications but .maybeSingle() got 0 rows.
    // Fix: apply migration 20260628000003_fix_applications_rls.sql
    logger.warn('[Intake API] Mirror insert returned no row — RLS blocking SELECT after INSERT', {
      email:   clean(body.email as string),
      program: programInterest,
      action:  'Apply migration 20260628000003_fix_applications_rls.sql in Supabase Dashboard',
    });
  } else {
    logger.info('[Intake API] Application row created', { id: appRow.id });
  }

  // Never use a timestamp-based fallback ID in the response — it produces a
  // 404 on the admin review page because no applications row has that ID.
  // If the mirror failed, omit the applicationId from the response entirely
  // and let the admin find the record via apprenticeship_intake.
  const applicationId = appRow?.id ?? null;

  // Auto-create a workforce_referrals row when the applicant came through a
  // workforce agency (WorkOne, FSSA, etc.). This satisfies Fix 6 of the
  // workforce pipeline spec — agency referrals must be structured records.
  const WORKFORCE_AGENCY_SOURCES: Record<string, string> = {
    workone: 'workone',
    'workforce-connection': 'workone',
    fssa: 'fssa',
    'snap-et': 'fssa',
    dwd: 'workone',
    'vocational-rehab': 'vocational_rehabilitation',
    vr: 'vocational_rehabilitation',
    jri: 'jri',
    'reentry-program': 'jri',
  };
  const referralSourceRaw = (body.referral_source as string | undefined)?.toLowerCase().trim() ?? '';
  const workforceConnectionRaw = (body.workforce_connection as string | undefined)?.toLowerCase().trim() ?? '';
  const agencyKey = WORKFORCE_AGENCY_SOURCES[referralSourceRaw] ?? WORKFORCE_AGENCY_SOURCES[workforceConnectionRaw];

  // Non-blocking side-effects — run after the response is returned.
  // Each is wrapped in a named async function so errors are logged with context
  // rather than silently swallowed by the runtime.
  const intakeEmail = (body.email as string | undefined)?.trim().toLowerCase();

  async function createWorkforceReferral() {
    if (!agencyKey || !body.email) return;
    const { error: refErr } = await supabase.from('workforce_referrals').insert({
      applicant_name:  (body.full_name as string).trim(),
      applicant_email: (body.email as string).trim().toLowerCase(),
      applicant_phone: (body.phone as string | undefined)?.trim() || null,
      agency:          agencyKey,
      program_interest: programInterest ?? null,
      status: 'referred',
    });
    if (refErr) {
      logger.warn('[Intake API] workforce_referrals insert failed', {
        error: refErr.message, code: refErr.code, email: intakeEmail,
      });
    }
  }

  async function provisionLearner() {
    if (!intakeEmail) return;
    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      intakeEmail,
      {
        data: { full_name: (body.full_name as string).trim(), role: 'student' },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? PLATFORM_DEFAULTS.siteUrl}/learner/dashboard`,
      },
    );
    if (inviteError) {
      logger.warn('[Intake API] Auth invite failed', {
        email: intakeEmail, error: inviteError.message,
      });
      return;
    }
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id:        invited.user.id,
        email:     intakeEmail,
        full_name: (body.full_name as string).trim(),
        role:      'student',
        phone:     (body.phone as string | undefined)?.trim() || null,
      },
      { onConflict: 'id', ignoreDuplicates: false },
    );
    if (profileErr) {
      logger.warn('[Intake API] Profile upsert failed', {
        email: intakeEmail, error: profileErr.message, code: profileErr.code,
      });
    }
  }

  // Fire both side-effects without awaiting — errors are caught and logged inside
  // each function. Using void + Promise.allSettled so unhandled-rejection warnings
  // don't surface in the runtime.
  void Promise.allSettled([createWorkforceReferral(), provisionLearner()])
    .then((results) => {
      results.forEach((r) => {
        if (r.status === 'rejected') {
          logger.error('[Intake API] Side-effect threw unexpectedly', {
            error: r.reason instanceof Error ? r.reason.message : String(r.reason),
          });
        }
      });
    });

  // Send email notifications (non-blocking — don't fail the response if email fails)
  const applicationData = {
    // Use the real applications UUID when available; fall back to a descriptive
    // placeholder so the admin email still renders rather than showing "null".
    id: applicationId ?? `(mirror-failed — find in apprenticeship_intake by email: ${intakeEmail ?? 'unknown'})`,
    firstName,
    lastName,
    email: intakeEmail ?? '',
    phone: (body.phone as string | undefined)?.trim(),
    programInterest: programInterest || 'general',
    city: (body.city as string | undefined)?.trim(),
    zipCode,
    submittedAt: new Date().toISOString(),
    // Full intake fields for the admin email
    dateOfBirth: (body.date_of_birth as string | undefined)?.trim(),
    county: (body.county as string | undefined)?.trim(),
    state: (body.state as string | undefined)?.trim() || 'IN',
    preferredLocation: (body.preferred_location as string | undefined)?.trim(),
    employmentStatus: (body.employment_status as string | undefined)?.trim(),
    fundingNeeded: body.funding_needed !== 'false',
    householdSize: (body.household_size as string | undefined)?.trim(),
    annualIncome: (body.annual_income as string | undefined)?.trim(),
    snapRecipient: body.snap_recipient === 'true',
    tanfRecipient: body.tanf_recipient === 'true',
    probationOrReentry: body.probation_or_reentry === 'true',
    workforceConnection: (body.workforce_connection as string | undefined)?.trim(),
    referralSource: (body.referral_source as string | undefined)?.trim(),
    barriers,
    fundingTag,
    notes: (body.notes as string | undefined)?.trim(),
  };

  try {
    const emailPromises: Promise<unknown>[] = [];

    // Send admin notification always
    emailPromises.push(sendAdminApplicationNotification(applicationData));

    // Send student confirmation if they provided an email
    if (applicationData.email) {
      emailPromises.push(sendApplicationConfirmation(applicationData));
    }

    await Promise.allSettled(emailPromises);
  } catch (emailError) {
    // Log but don't fail the intake submission
    logger.error(
      '[Intake API] Email notification failed',
      emailError instanceof Error ? emailError.message : 'Unknown error',
    );
  }

  return NextResponse.json({
    success: true,
    funding_tag: fundingTag,
    ...(applicationId ? { application_id: applicationId } : { mirror_failed: true }),
  });
}
export const POST = withApiAudit('/api/intake', _POST);
