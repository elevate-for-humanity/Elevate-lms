/**
 * provisionAccount
 *
 * Creates a Supabase auth user + profile for a new enrollee, then sends a
 * welcome email containing their login URL, a password-set link, and next steps.
 *
 * Called from post-payment pipelines and the partner MOU sign route.
 * Idempotent — if the profile already exists, returns the existing userId and
 * sends a "you're now enrolled" email instead of a "set your password" email.
 *
 * Returns { userId, isNewUser, error? }
 */

import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/lib/supabase';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface ProvisionAccountInput {
  db: SupabaseClient;
  email: string;
  fullName: string;
  phone?: string | null;
  programName: string;
  programSlug: string;
  /** URL the student lands on after setting their password */
  postLoginUrl?: string;
}

export interface ProvisionAccountResult {
  userId: string | null;
  isNewUser: boolean;
  /** Password-set / recovery link for new users. Null for existing accounts. */
  passwordSetupLink?: string | null;
  error?: string;
}

const SITE_URL = () =>
  (process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl).trim();

export async function provisionAccount(
  input: ProvisionAccountInput,
): Promise<ProvisionAccountResult> {
  const { db, email, fullName, phone, programName, programSlug, postLoginUrl } = input;
  const normalizedEmail = email.toLowerCase().trim();
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] ?? 'there';
  const lastName = nameParts.slice(1).join(' ') || '';
  const siteUrl = SITE_URL();
  const loginUrl = `${siteUrl}/login`;
  // Always route through /auth/callback so the session is established correctly
  // and role-based routing runs. The destination is encoded as ?redirect=.
  const destination = postLoginUrl || '/learner/dashboard';
  const dashboardUrl = `${siteUrl}/auth/callback?redirect=${encodeURIComponent(destination)}`;
  const onboardingUrl = `${siteUrl}/programs/${programSlug}/orientation`;

  // ── 1. Check for existing profile ────────────────────────────────────────
  const { data: existing } = await db
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (existing?.id) {
    // Account already exists — send an enrollment confirmation email only
    try {
      const { sendEmail } = await import('@/lib/email/sendgrid');
      await sendEmail({
        to: normalizedEmail,
        from: '${PLATFORM_DEFAULTS.orgName} <${PLATFORM_DEFAULTS.emailFromAddress}>',
        replyTo: 'elevate4humanityedu@gmail.com',
        subject: `You're enrolled in ${programName} — ${PLATFORM_DEFAULTS.orgName}`,
        html: buildWelcomeEmail({
          firstName,
          programName,
          loginUrl,
          dashboardUrl,
          onboardingUrl,
          isNewUser: false,
          passwordSetUrl: null,
        }),
      });
    } catch (err) {
      logger.warn('[provision-account] Enrollment confirmation email failed (non-fatal)', err);
    }
    return { userId: existing.id, isNewUser: false, passwordSetupLink: null };
  }

  // ── 2. Create auth user ───────────────────────────────────────────────────
  const tempPassword = crypto.randomUUID().replace(/-/g, '') + 'Aa1!';

  const { data: authData, error: authErr } = await (db as any).auth.admin.createUser({
    email: normalizedEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
    },
  });

  if (authErr || !authData?.user) {
    logger.error('[provision-account] Auth user creation failed', undefined, {
      email: normalizedEmail,
      error: authErr?.message,
    });
    return { userId: null, isNewUser: false, passwordSetupLink: null, error: `Auth creation failed: ${authErr?.message}` };
  }

  const userId = authData.user.id as string;

  // ── 3. Create profile ─────────────────────────────────────────────────────
  const { error: profileErr } = await db.from('profiles').insert({
    id: userId,
    email: normalizedEmail,
    full_name: fullName,
    first_name: firstName,
    last_name: lastName,
    phone: phone ?? null,
    role: 'student',
    enrollment_status: 'active',
  });

  if (profileErr) {
    // Non-fatal — auth user exists, enrollment can still proceed
    logger.warn('[provision-account] Profile insert failed (non-fatal)', {
      userId,
      error: profileErr.message,
    });
  }

  // ── 4. Generate password-set link ─────────────────────────────────────────
  let passwordSetUrl: string | null = null;
  try {
    const { data: linkData, error: linkErr } = await (db as any).auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: {
        redirectTo: dashboardUrl,
      },
    });
    if (!linkErr && linkData?.properties?.action_link) {
      passwordSetUrl = linkData.properties.action_link as string;
    } else {
      logger.warn('[provision-account] generateLink failed', { error: linkErr?.message });
    }
  } catch (err) {
    logger.warn('[provision-account] generateLink threw (non-fatal)', err);
  }

  // ── 5. Send welcome + credentials email ───────────────────────────────────
  try {
    const { sendEmail } = await import('@/lib/email/sendgrid');
    await sendEmail({
      to: normalizedEmail,
      from: '${PLATFORM_DEFAULTS.orgName} <${PLATFORM_DEFAULTS.emailFromAddress}>',
      replyTo: 'elevate4humanityedu@gmail.com',
      subject: `Welcome to ${programName} — Set your password to access your portal`,
      html: buildWelcomeEmail({
        firstName,
        programName,
        loginUrl,
        dashboardUrl,
        onboardingUrl,
        isNewUser: true,
        passwordSetUrl,
      }),
    });
  } catch (err) {
    logger.warn('[provision-account] Welcome email failed (non-fatal)', err);
  }

  logger.info('[provision-account] Account provisioned', { userId, email: normalizedEmail });
  return { userId, isNewUser: true, passwordSetupLink: passwordSetUrl };
}

// ── Email template ────────────────────────────────────────────────────────────

function buildWelcomeEmail(opts: {
  firstName: string;
  programName: string;
  loginUrl: string;
  dashboardUrl: string;
  onboardingUrl: string;
  isNewUser: boolean;
  passwordSetUrl: string | null;
}): string {
  const { firstName, programName, loginUrl, dashboardUrl, onboardingUrl, isNewUser, passwordSetUrl } = opts;

  const credentialsBlock = isNewUser
    ? `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:0 0 16px;">
      <h3 style="margin:0 0 10px;color:#92400e;font-size:15px;">Your Portal Login</h3>
      <p style="margin:0 0 6px;color:#374151;font-size:14px;">
        <strong>Email:</strong> ${opts.loginUrl.replace('https://', '')} — use the email address you applied with
      </p>
      <p style="margin:0 0 14px;color:#374151;font-size:14px;">
        <strong>Password:</strong> You need to set one — click the button below (link expires in 24 hours).
      </p>
      ${
        passwordSetUrl
          ? `<p style="text-align:center;margin:0;">
          <a href="${passwordSetUrl}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
            Set My Password →
          </a>
        </p>
        <p style="color:#92400e;font-size:12px;margin:10px 0 0;text-align:center;">
          After setting your password, log in at <a href="${loginUrl}" style="color:#d97706;">${loginUrl}</a>
        </p>`
          : `<p style="text-align:center;margin:0;">
          <a href="${loginUrl}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
            Log In to Portal →
          </a>
        </p>`
      }
    </div>`
    : `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:0 0 16px;">
      <h3 style="margin:0 0 10px;color:#92400e;font-size:15px;">Your Portal Login</h3>
      <p style="margin:0 0 14px;color:#374151;font-size:14px;">
        Log in with the email and password you already set up.
      </p>
      <p style="text-align:center;margin:0;">
        <a href="${loginUrl}" style="display:inline-block;background:#d97706;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Log In to Portal →
        </a>
      </p>
    </div>`;

  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${PLATFORM_DEFAULTS.orgName}</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">${programName}</p>
  </div>
  <div style="padding:32px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">

    <h1 style="margin:0 0 8px;font-size:24px;color:#0f172a;">
      Welcome, ${firstName}. You're enrolled.
    </h1>
    <p style="color:#475569;margin:0 0 24px;font-size:15px;">
      Your enrollment in <strong>${programName}</strong> is confirmed. Here's everything you need to get started.
    </p>

    ${credentialsBlock}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:0 0 16px;">
      <h3 style="margin:0 0 12px;color:#166534;font-size:15px;">Step 1 — Complete Your Onboarding</h3>
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">
        Takes about 10 minutes. Unlocks your coursework and training schedule.
      </p>
      <p style="text-align:center;">
        <a href="${onboardingUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Start Onboarding →
        </a>
      </p>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:20px;margin:0 0 16px;">
      <h3 style="margin:0 0 12px;color:#1e40af;font-size:15px;">Step 2 — Access Your Student Portal</h3>
      <p style="margin:0 0 16px;color:#374151;font-size:14px;">
        Track your hours, coursework, and progress in one place.
      </p>
      <p style="text-align:center;">
        <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Go to Student Portal →
        </a>
      </p>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 24px;">
      <p style="margin:0 0 8px;font-weight:700;color:#0f172a;font-size:14px;">What happens next:</p>
      <ol style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">
        <li>${isNewUser ? 'Set your password (link above, expires in 24 hours)' : 'Log in to your portal'}</li>
        <li>Complete onboarding (10 min)</li>
        <li>An advisor will contact you within 1–2 business days to confirm your host shop and start date</li>
      </ol>
    </div>

    <p style="color:#475569;font-size:14px;">
      Questions? Call <a href="tel:${PLATFORM_DEFAULTS.supportPhone}" style="color:#ea580c;font-weight:700;">${PLATFORM_DEFAULTS.supportPhone}</a> or email
      <a href="mailto:info@${PLATFORM_DEFAULTS.canonicalDomain}" style="color:#ea580c;">info@${PLATFORM_DEFAULTS.canonicalDomain}</a>
    </p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      ${PLATFORM_DEFAULTS.orgName} · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
    </p>
  </div>
</div>`;
}
