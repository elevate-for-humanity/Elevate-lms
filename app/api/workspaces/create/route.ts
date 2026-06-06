// PUBLIC ROUTE: self-service workspace trial signup
import { NextRequest } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { hydrateProcessEnv } from '@/lib/secrets';
import { startWorkspaceTrial } from '@/lib/workspace/start-workspace-trial';
import { logger } from '@/lib/logger';
import { resend } from '@/lib/resend';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

async function sendWorkspaceWelcomeEmail(params: {
  email: string;
  organizationName: string;
  dashboardUrl: string;
  publicUrl: string;
  trialEndsAt: string;
}) {
  if (!process.env.SENDGRID_API_KEY) return;

  await resend.emails.send({
    from: `${PLATFORM_DEFAULTS.emailFromName} <${PLATFORM_DEFAULTS.emailFromAddress}>`,
    to: params.email,
    subject: `Your workspace is ready — ${params.organizationName}`,
    html: `
      <h1>Your 14-day workspace trial is live</h1>
      <p><strong>${params.organizationName}</strong> is ready to use.</p>
      <p><a href="${params.dashboardUrl}">Open admin dashboard</a></p>
      <p>Public site: <a href="${params.publicUrl}">${params.publicUrl}</a></p>
      <p>Trial ends: ${new Date(params.trialEndsAt).toLocaleDateString()}</p>
    `,
  });
}

/**
 * POST /api/workspaces/create
 *
 * Body: { organizationName, ownerEmail, ownerName?, industry?, plan? }
 */
async function _POST(request: NextRequest) {
  await hydrateProcessEnv();

  const rateLimited = await applyRateLimit(request, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const body = await request.json();
    const organizationName =
      body.organizationName ?? body.orgName ?? body.organization_name;
    const ownerEmail = body.ownerEmail ?? body.email ?? body.owner_email;
    const ownerName = body.ownerName ?? body.adminName ?? body.owner_name;
    const industry = body.industry ?? body.programs;
    const plan = body.plan ?? 'starter';

    const result = await startWorkspaceTrial({
      organizationName,
      ownerEmail,
      ownerName,
      industry,
      plan,
    });

    if (!result.ok) {
      return safeError(result.error, result.status ?? 400);
    }

    try {
      await sendWorkspaceWelcomeEmail({
        email: ownerEmail.trim().toLowerCase(),
        organizationName: organizationName.trim(),
        dashboardUrl: result.dashboardUrl,
        publicUrl: result.publicPreviewUrl,
        trialEndsAt: result.trialEndsAt,
      });
    } catch (emailErr) {
      logger.warn('[workspaces/create] welcome email failed', { emailErr });
    }

    return safeOk({
      success: true,
      tenantId: result.tenantId,
      workspaceId: result.workspaceId,
      organizationId: result.organizationId,
      slug: result.slug,
      workspaceUrl: result.workspaceUrl,
      publicPreviewUrl: result.publicPreviewUrl,
      dashboardUrl: result.dashboardUrl,
      trialEndsAt: result.trialEndsAt,
      status: result.status,
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to create workspace');
  }
}

export const POST = withRuntime(withApiAudit('/api/workspaces/create', _POST));
