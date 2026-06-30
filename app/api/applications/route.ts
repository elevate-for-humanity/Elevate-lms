// PUBLIC ROUTE: public program application submission

// app/api/applications/route.ts
import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getProgramEnrollmentState } from '@/lib/programs/program-state';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getRedisClient } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email/sendgrid';
import { provisionAccount } from '@/lib/enrollment/provision-account';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
// approveApplication is called by /api/admin/applications/[id]/approve — not here
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

function getAllowedOrigins(): Set<string> {
  const configured = (process.env.APPLICATION_INTAKE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const defaults = [
    process.env.NEXT_PUBLIC_SITE_URL,
    PLATFORM_DEFAULTS.siteUrl,
    process.env.NEXT_PUBLIC_ADMIN_URL,
  ].filter(Boolean) as string[];

  return new Set([...configured, ...defaults]);
}

function getRequestOrigin(req: Request): string {
  return req.headers.get('origin') || '';
}

function isAllowedOrigin(origin: string, allowedOrigins: Set<string>): boolean {
  if (!origin) return true;
  return allowedOrigins.has(origin);
}

function corsHeadersForOrigin(origin: string, allowedOrigins: Set<string>) {
  const fallback = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : fallback;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Idempotency-Key',
    Vary: 'Origin',
  } as const;
}

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // No secret configured — skip verification (dev / unconfigured environments)
  if (!secret) return true;
  // No token sent — fail only when secret is configured
  if (!token) return false;

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    });
    const result = (await response.json()) as { success?: boolean };
    return !!result.success;
  } catch {
    return false;
  }
}

function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

async function claimIdempotencyKey(
  rawKey: string,
  fingerprint: string,
): Promise<{ duplicate: boolean; samePayload: boolean }> {
  if (!rawKey) return { duplicate: false, samePayload: false };

  const redis = getRedisClient();
  if (!redis) return { duplicate: false, samePayload: false };

  const key = `idempotency:applications:${rawKey}`;
  const ttlSeconds = Number(process.env.APPLICATION_INTAKE_IDEMPOTENCY_TTL_SECONDS || '86400');
  const value = JSON.stringify({ fingerprint, at: new Date().toISOString() });

  try {
    const setResult = await redis.set(key, value, { nx: true, ex: ttlSeconds });
    const claimed = setResult === 'OK' || setResult === 1 || setResult === true;
    if (claimed) {
      return { duplicate: false, samePayload: false };
    }

    const existing = await redis.get(key);
    const samePayload =
      typeof existing === 'string' &&
      existing.includes(`"fingerprint":"${fingerprint.replace(/"/g, '\\"')}"`);
    return { duplicate: true, samePayload };
  } catch (error) {
    logger.warn('[api/applications] idempotency check unavailable; continuing', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { duplicate: false, samePayload: false };
  }
}

// CORS preflight for cross-origin form submissions
export async function OPTIONS(req: Request) {
  const allowedOrigins = getAllowedOrigins();
  const origin = getRequestOrigin(req);
  if (!isAllowedOrigin(origin, allowedOrigins)) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeadersForOrigin(origin, allowedOrigins),
  });
}

// Public endpoint — anonymous application submissions
async function _POST(req: Request) {
  try {
    const allowedOrigins = getAllowedOrigins();
    const origin = getRequestOrigin(req);
    if (!isAllowedOrigin(origin, allowedOrigins)) {
      return NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const body = await req.json();

    // Honeypot field for commodity bots.
    if (body.website && String(body.website).trim() !== '') {
      return NextResponse.json(
        { ok: true, accepted: true },
        { status: 202, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    const turnstileToken = body.turnstileToken || body.cfTurnstileToken || '';
    const clientIp = getClientIp(req);
    const humanVerified = await verifyTurnstile(turnstileToken, clientIp);
    if (!humanVerified) {
      return NextResponse.json(
        { error: 'Bot verification failed' },
        { status: 403, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    // Basic required fields - core fields that all forms must have
    const coreRequired = ['firstName', 'lastName', 'phone', 'email'];

    // Program is required but can come from different field names
    const program = body.program || body.programSlug;
    if (!program) {
      return NextResponse.json(
        { error: 'Missing required field: program' },
        { status: 400, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    for (const field of coreRequired) {
      if (!body[field] || String(body[field]).trim() === '') {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400, headers: corsHeadersForOrigin(origin, allowedOrigins) },
        );
      }
    }

    const normalizedPhone = String(body.phone || '').replace(/\D/g, '');
    const idempotencyKey =
      (req.headers.get('x-idempotency-key') || body.idempotencyKey || '').trim().toLowerCase();
    if (idempotencyKey && idempotencyKey.length < 12) {
      return NextResponse.json(
        { error: 'Invalid idempotency key' },
        { status: 400, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    const fingerprint = `${String(body.email || '').toLowerCase().trim()}|${program}|${normalizedPhone}`;
    if (idempotencyKey) {
      const claim = await claimIdempotencyKey(idempotencyKey, fingerprint);
      if (claim.duplicate) {
        return NextResponse.json(
          {
            error: claim.samePayload
              ? 'Duplicate submission detected. Your application is already being processed.'
              : 'Idempotency key has already been used with a different payload.',
          },
          { status: 409, headers: corsHeadersForOrigin(origin, allowedOrigins) },
        );
      }
    }

    const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        {
          error:
            'Service temporarily unavailable. Please call ${PLATFORM_DEFAULTS.supportPhone} for immediate assistance.',
        },
        { status: 503, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    // Program state gate — reject submissions for waitlisted or closed programs
    const enrollmentState = await getProgramEnrollmentState(supabase, program);
    if (enrollmentState === 'waitlist') {
      return NextResponse.json(
        {
          error: 'This program is currently waitlisted. Join the waitlist to be notified when the next cohort opens.',
          waitlisted: true,
          waitlistUrl: `/programs/${program}`,
        },
        { status: 409, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }
    if (enrollmentState === 'closed') {
      return NextResponse.json(
        { error: 'This program is not currently accepting applications.' },
        { status: 410, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    // Dedup: block same email + program within 24 hours.
    // Excludes intake-form mirrors — those are pre-application inquiries, not submissions.
    // Allows re-application after the window (e.g. student applies months later).
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentApp } = await supabase
      .from('applications')
      .select('id')
      .eq('email', body.email.toLowerCase().trim())
      .eq('program_interest', program)
      .neq('source', 'intake-form')
      .gte('created_at', oneDayAgo)
      .limit(1)
      .maybeSingle();

    let recentByPhone: { id: string } | null = null;
    if (normalizedPhone.length >= 10) {
      const phoneQuery = await supabase
        .from('applications')
        .select('id')
        .eq('normalized_phone', normalizedPhone)
        .eq('program_interest', program)
        .neq('source', 'intake-form')
        .gte('created_at', oneDayAgo)
        .limit(1)
        .maybeSingle();
      if (!phoneQuery.error) {
        recentByPhone = phoneQuery.data;
      }
    }

    if (recentApp || recentByPhone) {
      return NextResponse.json(
        {
          error:
            'An application for this program was already submitted with this email in the last 24 hours. Please call ${PLATFORM_DEFAULTS.supportPhone} if you need to make changes.',
        },
        { status: 409, headers: corsHeadersForOrigin(origin, allowedOrigins) },
      );
    }

    // Generate reference number
    const referenceNumber = `EFH-${Date.now().toString(36).toUpperCase()}`;

    // Build notes field with all the extra data
    const notes = [
      `Reference: ${referenceNumber}`,
      body.city ? `City: ${body.city}` : '',
      body.state ? `State: ${body.state}` : '',
      body.address ? `Address: ${body.address}` : '',
      body.zip ? `ZIP: ${body.zip}` : '',
      `Program Interest: ${program}`,
      body.preferredContact ? `Preferred Contact: ${body.preferredContact}` : '',
      body.fundingType ? `Funding Type: ${body.fundingType}` : '',
      body.workoneIntakeCompleted
        ? `WorkOne Intake Completed: ${body.workoneIntakeCompleted}`
        : '',
      body.workoneAppointmentDate
        ? `WorkOne Appointment Date: ${body.workoneAppointmentDate}`
        : '',
      body.workoneCenter ? `WorkOne Center: ${body.workoneCenter}` : '',
      body.workoneChecklist && Array.isArray(body.workoneChecklist)
        ? `WorkOne Checklist: ${body.workoneChecklist.join(', ')}`
        : '',
      body.source ? `Source: ${body.source}` : '',
      body.hasHostShop ? `Has Host Shop: ${body.hasHostShop}` : '',
      body.hostShopName ? `Host Shop Name: ${body.hostShopName}` : '',
      body.howDidYouHear ? `How Did You Hear: ${body.howDidYouHear}` : '',
      body.hasCaseManager ? `Has Case Manager: ${body.hasCaseManager}` : '',
      body.caseManagerAgency ? `Case Manager Agency: ${body.caseManagerAgency}` : '',
      body.supportNeeds ? `Support Needs: ${body.supportNeeds}` : '',
      // Transfer hours are stored in transfer_hours_claimed column — not duplicated here.
    ]
      .filter(Boolean)
      .join('\n');

    // Insert into applications table
    // Parse claimed transfer hours — stored in structured column, not notes.
    // Does not affect pricing. Progress credit only.
    const transferHoursClaimed = Math.max(
      0,
      parseInt(body.transferHours ?? body.transfer_hours_claimed ?? '0') || 0,
    );

    // Determine application status based on funding type and eligibility.
    // WIOA / WRG / FSSA applications require admin approval before enrollment.
    // Students who have not yet been to Indiana Career Connect are saved as
    // 'pending_funding' — they must complete the ICC process and reapply.
    const FUNDED_TYPES = ['wioa', 'wrg', 'fssa'];
    const fundingType = body.fundingType || body.fundingInterest || null;
    const eligibilityStatus = body.fundingEligibilityStatus || null;
    const isFunded = FUNDED_TYPES.includes(fundingType);
    const needsICC = isFunded && eligibilityStatus === 'needs_appointment';

    let applicationStatus: string;
    if (needsICC) {
      // Has not been to ICC yet — hold application, send them to ICC first
      applicationStatus = 'pending_funding';
    } else if (isFunded) {
      // Has ICC approval or is in process — needs admin review before enrollment
      applicationStatus = 'pending_admin_review';
    } else {
      // Self-pay, employer, unsure — standard submitted flow
      applicationStatus = 'submitted';
    }

    // Core insert payload — columns confirmed to exist in all environments
    const corePayload: Record<string, any> = {
      first_name: body.firstName,
      last_name: body.lastName,
      phone: body.phone,
      email: body.email,
      normalized_email: body.email.toLowerCase().trim(),
      normalized_phone: body.phone.replace(/\D/g, ''),
      city: body.city || 'Not provided',
      zip: body.zip || '00000',
      program_interest: program,
      program_slug: body.programSlug || body.program_slug || null,
      support_notes: notes,
      status: applicationStatus,
      source: body.source || 'website',
      contact_preference: body.preferredContact || 'phone',
      transfer_hours_claimed: transferHoursClaimed,
      funding_type: fundingType,
      funding_eligibility_status: eligibilityStatus,
      reference_number: referenceNumber,
      type: 'student',
      date_of_birth: body.dateOfBirth || null,
      county_of_residence: body.countyOfResidence || null,
      household_income: body.householdIncome ? Number(body.householdIncome) : null,
      family_size: body.familySize ? Number(body.familySize) : null,
      modality_preference: body.modalityPreference || null,
    };

    let { data, error }: any = await supabase
      .from('applications')
      .insert(corePayload)
      .select()
      .maybeSingle();

    // Three-tier retry — each tier strips more columns to handle DB environments
    // where migrations haven't been applied yet.
    //
    // Tier 1 (corePayload): all columns including recent migrations
    // Tier 2: strip columns from migrations 20260425–20260621 (funding_eligibility_status,
    //         normalized_email/phone, county_of_residence, household_income, family_size,
    //         modality_preference, transfer_hours_claimed, type)
    // Tier 3 (baseline): only the 15 columns present in the original schema baseline
    //         (20260227000003) — this MUST succeed or the DB is broken
    //
    // Error codes:
    //   42703 = unknown column
    //   23514 = check constraint violation (status values not yet in constraint)
    //   23502 = not-null violation (column exists but has unexpected NOT NULL)

    const isRetryableError = (e: any) =>
      e &&
      (e.code === '42703' ||
        e.code === '23514' ||
        e.code === '23502' ||
        e.message?.includes('column') ||
        e.message?.includes('constraint') ||
        e.message?.includes('check') ||
        e.message?.includes('violates'));

    // Tier 2 — strip columns from post-baseline migrations
    if (isRetryableError(error)) {
      logger.warn('[api/applications] Tier-2 retry — stripping extended columns', {
        code: error.code,
        message: error.message,
      });
      const tier2 = await supabase
        .from('applications')
        .insert({
          ...corePayload,
          // Strip columns added in migrations that may not be live yet.
          // Keep this list in sync with corePayload — any column not in the
          // baseline schema (20260227000003) must be stripped here.
          normalized_email: undefined,
          normalized_phone: undefined,
          county_of_residence: undefined,
          household_income: undefined,
          family_size: undefined,
          modality_preference: undefined,
          transfer_hours_claimed: undefined,
          funding_eligibility_status: undefined,
          funding_type: undefined,       // added in 20260425000001
          program_slug: undefined,       // added in 20260224000002 (applications table)
          date_of_birth: undefined,      // added in 20260304120000
          type: undefined,
          status: 'submitted',
        })
        .select()
        .maybeSingle();
      data = tier2.data;
      error = tier2.error;
    }

    // Tier 3 — absolute baseline: only columns guaranteed in 20260227000003
    if (isRetryableError(error)) {
      logger.warn('[api/applications] Tier-3 retry — baseline columns only', {
        code: error.code,
        message: error.message,
      });
      const tier3 = await supabase
        .from('applications')
        .insert({
          first_name: body.firstName,
          last_name: body.lastName,
          phone: body.phone,
          email: body.email,
          city: body.city || 'Not provided',
          zip: body.zip || '00000',
          program_interest: program,
          support_notes: notes,
          status: 'submitted',
          source: body.source || 'website',
          contact_preference: body.preferredContact || 'phone',
        })
        .select()
        .maybeSingle();
      data = tier3.data;
      error = tier3.error;
    }

    if (error || !data) {
      logger.error('[api/applications] All insert tiers failed', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        program,
        email: body.email,
      });
      return NextResponse.json(
        {
          error: `Failed to save application. Please call ${PLATFORM_DEFAULTS.supportPhone} for immediate assistance.`,
          debug: process.env.NODE_ENV === 'development' ? (error as any)?.message : undefined,
        },
        { status: 500 },
      );
    }

    // Provision auth account immediately so the applicant can access the portal
    // and complete onboarding while their application is under review.
    // Admin still approves before enrollment is activated.
    let userId: string | null = null;
    let passwordSetupLink: string | null = null;

    if (supabase) {
      const programSlug = body.program_slug || body.preferredProgramId || '';
      const { data: programRow } = await supabase
        .from('programs')
        .select('title')
        .eq('slug', programSlug)
        .maybeSingle();
      const programName =
        programRow?.title ||
        programSlug.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
        'your program';

      const provision = await provisionAccount({
        db: supabase,
        email: body.email,
        fullName: `${body.first_name || ''} ${body.last_name || ''}`.trim() || body.email,
        phone: body.phone || null,
        programName,
        programSlug,
        postLoginUrl: '/onboarding/learner',
      });

      if (provision.error) {
        logger.warn('[Applications] provisionAccount non-fatal', { error: provision.error, email: body.email });
      } else {
        userId = provision.userId ?? null;
        passwordSetupLink = provision.passwordSetupLink ?? null;
        logger.info('[Applications] Account provisioned', { userId, isNewUser: provision.isNewUser });
      }

      // Link provisioned userId back to the application row
      if (userId && data?.id) {
        await supabase
          .from('applications')
          .update({ user_id: userId })
          .eq('id', data.id)
          .then(undefined, (err) =>
            logger.warn('[Applications] Failed to link user_id', { err: String(err) }),
          );
      }
    }

    logger.info('[Applications] Saved — pending admin review', {
      applicationId: data.id,
      fundingType,
      eligibilityStatus,
      applicationStatus,
    });

    // Send email notifications — direct call, no self-fetch
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
    let emailStatus: { student: string; staff: string } = {
      student: 'not-attempted',
      staff: 'not-attempted',
    };
    try {
      logger.info('[Applications] Sending confirmation email', {
        to: body.email,
        ref: referenceNumber,
        hasPasswordLink: !!passwordSetupLink,
      });

      // Build password setup section (only for new users)
      const passwordSection = passwordSetupLink
        ? `
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #065f46;">Your Student Account Is Ready</h3>
              <p style="margin-bottom: 16px;">We created your student portal account. Set your password to log in:</p>
              <p style="text-align: center; margin: 16px 0;">
                <a href="${passwordSetupLink}" style="display: inline-block; background: #ea580c; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Set Your Password &amp; Log In</a>
              </p>
              <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">This link expires in 24 hours. After setting your password, you can log in anytime at <a href="${siteUrl}/login" style="color: #059669;">${siteUrl}/login</a></p>
            </div>
      `
        : '';

      // Confirmation + onboarding email to applicant
      // Build next-steps content based on application status
      const fundingLabel: Record<string, string> = {
        wioa: 'WIOA (Workforce Innovation and Opportunity Act)',
        wrg: 'Workforce Ready Grant / Next Level Jobs',
        fssa: 'FSSA IMPACT',
      };
      const fundingName = fundingType ? fundingLabel[fundingType] || fundingType : null;

      const nextStepsHtml = needsICC
        ? `
        <div style="background: #fffbeb; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Action Required — Complete Indiana Career Connect First</h3>
          <p style="color: #78350f;">You selected <strong>${fundingName}</strong> as your funding option. Before we can enroll you, you must complete the Indiana Career Connect process and receive your funding approval.</p>
          <h4 style="color: #92400e; margin-bottom: 8px;">Your next steps:</h4>
          <ol style="color: #78350f; padding-left: 20px; line-height: 1.8;">
            <li>Go to <a href="https://www.indianacareerconnect.com" style="color: #ea580c; font-weight: bold;">IndianaCareerConnect.com</a> and create a free account</li>
            <li>Complete your profile and upload your resume</li>
            <li>Schedule an appointment at your nearest WorkOne center</li>
            <li>Receive your funding approval letter (ITA, WRG approval, or FSSA authorization)</li>
            <li><strong>Come back and reapply</strong> — your application will be fast-tracked once you have your approval letter</li>
          </ol>
          <p style="margin-bottom: 12px; color: #78350f;"><strong>Need help?</strong> Our enrollment team can walk you through the process.</p>
          <a href="https://www.indianacareerconnect.com" style="display: inline-block; background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-right: 8px;">Go to Indiana Career Connect</a>
          <a href="https://www.in.gov/dwd/find-a-workone-center/" style="display: inline-block; background: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Find a WorkOne Center</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">Once you have your approval letter, reapply at <a href="${siteUrl}/programs/hvac-technician/apply" style="color: #ea580c;">${siteUrl}/programs</a> and select your funding type. Your application will be prioritized.</p>
      `
        : isFunded
          ? `
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e40af;">Application Received — Pending Admin Review</h3>
          <p style="color: #1e3a8a;">You selected <strong>${fundingName}</strong> as your funding option. Your application has been received and is pending review by our enrollment team.</p>
          <h4 style="color: #1e40af; margin-bottom: 8px;">What happens next:</h4>
          <ol style="color: #1e3a8a; padding-left: 20px; line-height: 1.8;">
            <li>Our enrollment team reviews your application (1–2 business days)</li>
            <li>We verify your funding status with ${fundingType === 'wioa' ? 'WorkOne' : fundingType === 'wrg' ? 'Indiana Career Connect' : 'FSSA'}</li>
            <li>Once verified, we contact you to complete enrollment and schedule your start date</li>
            <li>You begin training — no tuition due until funding is confirmed</li>
          </ol>
        </div>
        ${passwordSection}
      `
          : `
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
          <h3 style="margin-top:0;color:#14532d;">Application Received — Under Review</h3>
          <p style="color:#166534;">Your application for <strong>${body.program}</strong> has been received. Our enrollment team will review it and reach out within 1–2 business days.</p>
          <ol style="color:#166534;padding-left:20px;line-height:1.8;">
            <li>Enrollment team reviews your application</li>
            <li>We confirm your payment and program details</li>
            <li>You receive your account setup link and onboarding instructions by email</li>
            <li>You begin training</li>
          </ol>
          <p style="color:#166534;margin-bottom:0;"><strong>Questions?</strong> Call <a href="tel:${PLATFORM_DEFAULTS.supportPhone}" style="color:#ea580c;">${PLATFORM_DEFAULTS.supportPhone}</a> or email <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}" style="color:#ea580c;">info@${PLATFORM_DEFAULTS.canonicalDomain}</a></p>
        </div>
      `;

      const emailSubject = needsICC
        ? `Action Required — Complete Indiana Career Connect to Enroll [Ref: ${referenceNumber}]`
        : isFunded
          ? `Application Received — Pending Review [Ref: ${referenceNumber}]`
          : `Welcome to ${PLATFORM_DEFAULTS.orgName} — ${body.program} [Ref: ${referenceNumber}]`;

      const studentEmailResult = await sendEmail({
        to: body.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="padding: 24px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 2px solid #e5e7eb;">
              <h1 style="margin: 0; font-size: 24px;">${needsICC ? 'Next Step Required' : 'Welcome to ${PLATFORM_DEFAULTS.orgName}!'}</h1>
            </div>
            <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="font-size: 16px;">Hi ${body.firstName},</p>
              <p>Your application for <strong>${body.program}</strong> has been received${needsICC ? ', but there is one more step before we can enroll you.' : isFunded ? ' and is pending admin review.' : ' and your enrollment is being processed.'}</p>

              ${nextStepsHtml}

              ${
                !needsICC
                  ? `
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #ea580c;">Want to Talk Sooner?</h3>
                <p style="margin-bottom: 12px;">Schedule your advisor call now:</p>
                <a href="https://calendly.com/elevate4humanityedu" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Schedule Call Now</a>
              </div>`
                  : ''
              }

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">Your Reference Number:</p>
                <p style="margin: 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #0f172a;">${referenceNumber}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Application ID: ${data.id}</p>
              </div>

              <p>Questions? Call us at <a href="tel:${PLATFORM_DEFAULTS.supportPhone}" style="color: #ea580c; font-weight: bold;">${PLATFORM_DEFAULTS.supportPhone}</a> or email <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}" style="color: #ea580c;">info@${PLATFORM_DEFAULTS.canonicalDomain}</a></p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="color: #64748b; font-size: 13px; text-align: center;">
                ${PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute<br />
                8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240<br />
                <a href="${siteUrl}" style="color: #3b82f6;">${PLATFORM_DEFAULTS.canonicalDomain}</a>
              </p>
            </div>
          </div>
        `,
      });

      // Send staff email in parallel (don't wait for it to finish before responding)
      const staffSubject = needsICC
        ? `⚠ Pending Funding [${referenceNumber}]: ${body.firstName} ${body.lastName} — Needs ICC First`
        : isFunded
          ? `🔵 Admin Review Required [${referenceNumber}]: ${body.firstName} ${body.lastName} — ${fundingName}`
          : `New Application [${referenceNumber}]: ${body.firstName} ${body.lastName} - ${body.program}`;

      const staffEmailResult = await sendEmail({
        to: 'elevate4humanityedu@gmail.com',
        subject: staffSubject,
        html: `
          <h2>New Application Received</h2>
          ${needsICC ? `<div style="background:#fffbeb;border:2px solid #f59e0b;border-radius:8px;padding:16px;margin-bottom:16px;"><strong>⚠ ACTION: Student has NOT been to Indiana Career Connect.</strong> Do NOT enroll. Student has been emailed instructions to complete ICC and reapply.</div>` : ''}
          ${isFunded && !needsICC ? `<div style="background:#eff6ff;border:2px solid #3b82f6;border-radius:8px;padding:16px;margin-bottom:16px;"><strong>🔵 ADMIN REVIEW REQUIRED before enrollment.</strong> Verify ${fundingName} approval with the agency before approving this application.</div>` : ''}
          <p><strong>Reference:</strong> ${referenceNumber}</p>
          <p><strong>Name:</strong> ${body.firstName} ${body.lastName}</p>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Phone:</strong> ${body.phone}</p>
          <p><strong>Program:</strong> ${body.program}</p>
          <p><strong>Location:</strong> ${body.city || 'N/A'}, ${body.zip || 'N/A'}</p>
          <p><strong>Preferred Contact:</strong> ${body.preferredContact || 'phone'}</p>
          <p><strong>Funding Type:</strong> ${fundingName || 'Self-pay / Not specified'}</p>
          <p><strong>Funding Eligibility Status:</strong> ${eligibilityStatus || 'N/A'}</p>
          <p><strong>Application Status:</strong> ${applicationStatus}</p>
          ${body.hasCaseManager ? `<p><strong>Has Case Manager:</strong> ${body.hasCaseManager}</p>` : ''}
          ${body.caseManagerAgency ? `<p><strong>Agency:</strong> ${body.caseManagerAgency}</p>` : ''}
          ${body.supportNeeds ? `<p><strong>Support Needs:</strong> ${body.supportNeeds}</p>` : ''}
          <div style="text-align:center;margin:24px 0;">
            <a href="https://admin.${PLATFORM_DEFAULTS.canonicalDomain}/admin/applications/review/${data.id}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">Review &amp; Enroll →</a>
          </div>
          <p style="font-size:12px;color:#6b7280;text-align:center;">Application ID: ${data.id}</p>
        `,
      });

      if (staffEmailResult.success) {
        logger.info('[Applications] Staff email sent');
      } else {
        logger.error('[Applications] Staff email FAILED', undefined, { error: (staffEmailResult as any).error });
      }
      emailStatus = {
        student: studentEmailResult.success ? 'sent' : (studentEmailResult as any).error || 'failed',
        staff: staffEmailResult.success ? 'sent' : (staffEmailResult as any).error || 'failed',
      };
    } catch (emailError) {
      logger.error(
        '[Applications] Email send threw exception',
        emailError instanceof Error ? emailError : undefined,
      );
      emailStatus = { student: 'exception', staff: 'exception' };
    }

    return NextResponse.json(
      {
        ok: true,
        id: data.id,
        email: data.email,
        program: data.program_id,
        referenceNumber: referenceNumber,
        emailStatus,
      },
      { status: 200, headers: corsHeadersForOrigin(origin, allowedOrigins) },
    );
  } catch (error) {
    const allowedOrigins = getAllowedOrigins();
    const origin = getRequestOrigin(req);
    return NextResponse.json(
      {
        error: 'Unexpected error. Please call 317-314-3757 for immediate assistance.',
      },
      { status: 500, headers: corsHeadersForOrigin(origin, allowedOrigins) },
    );
  }
}
export const POST = withApiAudit('/api/applications', _POST);
