import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { runDailyIndianaComplianceCheck } from '@/lib/compliance/indiana-automation';
import { generateWIOAReport, scheduleWIOAReports } from '@/lib/compliance/wioa-automation';
import { getAllRequirements, getCriticalRequirements, getReportingStatus } from '@/lib/compliance/reporting-schedules';
import { shouldSendAlert, getAlertTimeline } from '@/lib/compliance/alert-system';
import { verifyCredential, getPendingVerifications, generateCredentialReport } from '@/lib/compliance/credential-verification';
import { submitUI3Request, generateUI3Report } from '@/lib/compliance/ui3-integration';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminRole } from '@/lib/api/requireAdminRole';

/**
 * Compliance Automation API
 * Runs compliance checks, generates reports, verifies credentials
 */

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const adminCheck = await requireAdminRole();
    if (adminCheck) return adminCheck;

    const { action, ...params } = await request.json();

    switch (action) {
      case 'indiana-check': {
        const result = await runDailyIndianaComplianceCheck();
        return NextResponse.json({ success: true, ...result });
      }

      case 'wioa-report': {
        const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3));
        const endDate = params.endDate ? new Date(params.endDate) : new Date();
        const report = await generateWIOAReport(startDate, endDate);
        return NextResponse.json({ success: true, report });
      }

      case 'schedule-wioa': {
        const result = await scheduleWIOAReports();
        return NextResponse.json({ success: true, result });
      }

      case 'verify-credential': {
        const result = await verifyCredential(params);
        return NextResponse.json({ success: true, result });
      }

      case 'pending-verifications': {
        const pending = await getPendingVerifications();
        return NextResponse.json({ success: true, pending });
      }

      case 'credential-report': {
        const report = await generateCredentialReport();
        return NextResponse.json({ success: true, report });
      }

      case 'ui3-submit': {
        const result = await submitUI3Request(params.participantIds || [], params.quarter);
        return NextResponse.json({ success: true, result });
      }

      case 'ui3-report': {
        const report = await generateUI3Report();
        return NextResponse.json({ success: true, report });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    logger.error('Compliance automation error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: toErrorMessage(error) || 'Compliance automation failed' }, { status: 500 });
  }
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

    const adminCheck = await requireAdminRole();
    if (adminCheck) return adminCheck;

  const requirements = getAllRequirements();
  const critical = getCriticalRequirements();

  return NextResponse.json({
    totalRequirements: requirements.length,
    criticalRequirements: critical.length,
    requirements: requirements.map(r => ({
      ...r,
      status: getReportingStatus(r, new Date()),
    })),
  });
}

export const GET = withApiAudit('/api/compliance/automation', _GET);
export const POST = withApiAudit('/api/compliance/automation', _POST);
