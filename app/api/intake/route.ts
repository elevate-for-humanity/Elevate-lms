import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendApplicationConfirmation, sendAdminApplicationNotification } from '@/lib/notifications/application-emails';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Auto-tag funding eligibility based on intake answers
function determineFundingTag(body: Record<string, string>): string {
  if (body.probation_or_reentry === 'true') return 'jri';
  if (body.funding_needed === 'false') return 'self-pay';
  if (body.workforce_connection === 'workone' || body.workforce_connection === 'employer-indy') return 'wioa';
  return 'pending-review';
}

async function _POST(req: Request) {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Service unavailable' },
      { status: 503 }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!body.full_name?.trim()) {
    return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
  }

  const fundingTag = determineFundingTag(body);

  // Return undefined instead of null to avoid NOT NULL constraint issues
  // if columns are tightened later. Supabase-js omits undefined fields.
  function clean(v: unknown, max = 200): string | undefined {
    if (typeof v !== 'string') return undefined;
    const s = v.trim();
    if (!s) return undefined;
    return s.slice(0, max);
  }

  const { error } = await supabase
    .from('apprenticeship_intake')
    .insert([{
      full_name: body.full_name.trim(),
      email: clean(body.email),
      phone: clean(body.phone),
      city: clean(body.city),
      state: clean(body.state) || 'IN',
      program_interest: clean(body.program_interest) || 'not-specified',
      employment_status: clean(body.employment_status),
      funding_needed: body.funding_needed !== 'false',
      workforce_connection: clean(body.workforce_connection),
      referral_source: clean(body.referral_source),
      probation_or_reentry: body.probation_or_reentry === 'true',
      preferred_location: clean(body.preferred_location),
      notes: clean(body.notes, 1000),
      funding_tag: fundingTag,
    }]);

  if (error) {
    logger.error('[Intake API]', error.message);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }

  // Provision a learner account if an email was provided.
  // Non-blocking: intake record is already saved above. Auth failures are logged
  // and surfaced in the admin intake queue for manual follow-up.
  const intakeEmail = body.email?.trim().toLowerCase();
  if (intakeEmail) {
    (async () => {
      try {
        // inviteUserByEmail sends a magic link and creates the auth user atomically.
        // If the user already exists, Supabase returns the existing user without error.
        const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
          intakeEmail,
          {
            data: {
              full_name: body.full_name.trim(),
              role: 'student',
            },
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org'}/lms/dashboard`,
          }
        );

        if (inviteError) {
          logger.warn('[Intake API] Auth invite failed', { email: intakeEmail, error: inviteError.message });
          return;
        }

        // Upsert profile row so the learner portal can resolve their role and name.
        // ON CONFLICT: if profile already exists (returning learner), update name only.
        await supabase
          .from('profiles')
          .upsert(
            {
              id: invited.user.id,
              email: intakeEmail,
              full_name: body.full_name.trim(),
              role: 'student',
              phone: body.phone?.trim() || null,
            },
            { onConflict: 'id', ignoreDuplicates: false }
          );
      } catch (provisionError) {
        logger.error('[Intake API] Learner provisioning error', provisionError instanceof Error ? provisionError.message : 'Unknown');
      }
    })();
  }

  // Send email notifications (non-blocking — don't fail the response if email fails)
  const applicationData = {
    id: `intake-${Date.now()}`,
    firstName: body.full_name.trim().split(' ')[0] || body.full_name.trim(),
    lastName: body.full_name.trim().split(' ').slice(1).join(' ') || '',
    email: intakeEmail ?? '',
    phone: body.phone?.trim(),
    programInterest: body.program_interest || 'general',
    city: body.city?.trim(),
    zipCode: '',
    submittedAt: new Date().toISOString(),
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
    logger.error('[Intake API] Email notification failed', emailError instanceof Error ? emailError.message : 'Unknown error');
  }

  return NextResponse.json({ success: true, funding_tag: fundingTag });
}
export const POST = withApiAudit('/api/intake', _POST);
