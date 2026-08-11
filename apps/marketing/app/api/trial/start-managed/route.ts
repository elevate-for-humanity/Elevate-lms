// PUBLIC ROUTE: managed trial start form
import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { strictRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { logger } from '@/lib/logger';
import { startWorkspaceTrial } from '@/lib/workspace/start-workspace-trial';

const fallbackLimiter = new Map<string, { count: number; reset: number }>();

function emailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function allowed(email: string) {
  const limiter = strictRateLimit.get();
  if (limiter) return (await limiter.limit(`trial:${email}`)).success;
  const now = Date.now();
  const current = fallbackLimiter.get(email);
  if (!current || current.reset < now) {
    fallbackLimiter.set(email, { count: 1, reset: now + 60 * 60 * 1000 });
    return true;
  }
  if (current.count >= 3) return false;
  current.count += 1;
  return true;
}

async function sendWelcome(params: {
  email: string;
  orgName: string;
  loginUrl: string;
  publicPreviewUrl: string;
  trialEndsAt: string;
  reference: string;
}) {
  await resend.emails.send({
    from: `Elevate LMS <${PLATFORM_DEFAULTS.emailFromAddress}>`,
    to: params.email,
    subject: `Your 14-day Elevate platform trial — ${params.orgName}`,
    html: `
      <h1>Your organization trial is ready.</h1>
      <p><strong>${params.orgName}</strong></p>
      <p><a href="${params.loginUrl}" style="display:inline-block;padding:12px 20px;background:#dc2626;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Sign in to your workspace</a></p>
      <p>Public preview: <a href="${params.publicPreviewUrl}">${params.publicPreviewUrl}</a></p>
      <p>Trial ends: ${new Date(params.trialEndsAt).toLocaleDateString('en-US')}</p>
      <p>Reference: ${params.reference}</p>
    `,
  });
}

async function _POST(request: NextRequest) {
  const reference = `trial_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const body = await request.json().catch(() => ({}));
    const organizationName = typeof body.orgName === 'string' ? body.orgName.trim() : '';
    const ownerName = typeof body.adminName === 'string' ? body.adminName.trim() : '';
    const ownerEmail = typeof body.adminEmail === 'string' ? body.adminEmail.trim().toLowerCase() : '';
    const industry = typeof body.industry === 'string' && body.industry.trim()
      ? body.industry.trim()
      : 'Training Provider';

    if (
      organizationName.length < 2 ||
      organizationName.length > 100 ||
      ownerName.length < 2 ||
      !emailValid(ownerEmail)
    ) {
      return NextResponse.json(
        {
          error: 'Valid organization name, administrator name, and email are required.',
          correlationId: reference,
        },
        { status: 400 },
      );
    }

    if (!(await allowed(ownerEmail))) {
      return NextResponse.json(
        { error: 'Too many trial requests. Please try again later.', correlationId: reference },
        { status: 429 },
      );
    }

    const trial = await startWorkspaceTrial({
      organizationName,
      ownerEmail,
      ownerName,
      industry,
      plan: 'builder',
    });

    if ('error' in trial) {
      return NextResponse.json(
        { error: trial.error, correlationId: reference },
        { status: typeof trial.status === 'number' ? trial.status : 500 },
      );
    }

    const db = await requireAdminClient();
    const generated = await db.auth.admin.generateLink({
      type: 'magiclink',
      email: ownerEmail,
      options: {
        redirectTo: trial.dashboardUrl,
        data: {
          full_name: ownerName,
          role: 'org_admin',
          organization_id: trial.organizationId,
          tenant_id: trial.tenantId,
        },
      },
    });

    const authUser = generated.data?.user;
    if (authUser?.id) {
      const profilePayload = {
        id: authUser.id,
        email: ownerEmail,
        full_name: ownerName,
        role: 'org_admin',
        organization_id: trial.organizationId,
        tenant_id: trial.tenantId,
      } as Record<string, unknown>;

      const { error: profileError } = await db
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' });

      if (profileError) {
        logger.error('[trial] profile provisioning failed', profileError, { reference });
        return NextResponse.json(
          {
            error: 'Workspace was created but the administrator profile could not be linked.',
            correlationId: reference,
          },
          { status: 500 },
        );
      }
    }

    await db.from('license_events').insert({
      organization_id: trial.organizationId,
      event_type: 'trial_workspace_created',
      event_data: {
        correlation_id: reference,
        tenant_id: trial.tenantId,
        workspace_id: trial.workspaceId,
        owner_email: ownerEmail,
      },
    });

    const fallbackLogin = `https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent(trial.dashboardUrl)}`;
    const loginUrl = generated.data?.properties?.action_link ?? fallbackLogin;

    try {
      await sendWelcome({
        email: ownerEmail,
        orgName: organizationName,
        loginUrl,
        publicPreviewUrl: trial.publicPreviewUrl,
        trialEndsAt: trial.trialEndsAt,
        reference,
      });
    } catch (mailErr) {
      logger.warn('[trial] welcome email failed', {
        reference,
        error: mailErr instanceof Error ? mailErr.message : String(mailErr),
      });
    }

    return NextResponse.json({
      ok: true,
      tenantId: trial.tenantId,
      organizationId: trial.organizationId,
      workspaceId: trial.workspaceId,
      slug: trial.slug,
      workspaceUrl: trial.workspaceUrl,
      publicPreviewUrl: trial.publicPreviewUrl,
      dashboardUrl: trial.dashboardUrl,
      loginUrl,
      trialEndsAt: trial.trialEndsAt,
      status: trial.status,
      correlationId: reference,
    });
  } catch (error) {
    logger.error('[trial] unhandled managed trial start failure', error, { reference });
    return NextResponse.json(
      {
        error: 'We could not start your trial right now. Please try again or contact support.',
        correlationId: reference,
      },
      { status: 500 },
    );
  }
}

export const POST = withRuntime(withApiAudit('/api/trial/start-managed', _POST));
