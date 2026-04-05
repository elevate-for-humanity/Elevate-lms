

/**
 * Grant Submission API
 * Record and track grant submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  recordEmailSubmission,
  recordPortalSubmission,
  updateSubmissionStatus,
  getSubmissionHistory,
  addTimelineEvent,
} from '@/lib/grants/submission-tracker';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiRequireAdmin } from '@/lib/admin/guards';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'strict');
    if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);


    const body = await req.json();
    const { action, applicationId, submittedBy, method, details } = body;

    switch (action) {
      case 'record_email':
        if (!applicationId || !submittedBy || !details) {
          return NextResponse.json(
            { error: 'applicationId, submittedBy, and details required' },
            { status: 400 }
          );
        }
        const emailSubmission = await recordEmailSubmission(
          applicationId,
          submittedBy,
          details
        );
        return NextResponse.json({ success: true, submission: emailSubmission });

      case 'record_portal':
        if (!applicationId || !submittedBy || !details) {
          return NextResponse.json(
            { error: 'applicationId, submittedBy, and details required' },
            { status: 400 }
          );
        }
        const portalSubmission = await recordPortalSubmission(
          applicationId,
          submittedBy,
          details
        );
        return NextResponse.json({ success: true, submission: portalSubmission });

      case 'update_status':
        if (!body.submissionId || !body.status) {
          return NextResponse.json(
            { error: 'submissionId and status required' },
            { status: 400 }
          );
        }
        await updateSubmissionStatus(
          body.submissionId,
          body.status,
          body.notes,
          body.performedBy
        );
        return NextResponse.json({ success: true, message: 'Status updated' });

      case 'add_timeline_event':
        if (!body.submissionId || !body.event) {
          return NextResponse.json(
            { error: 'submissionId and event required' },
            { status: 400 }
          );
        }
        await addTimelineEvent(body.submissionId, {
          event: body.event.event,
          description: body.event.description,
          performedBy: body.event.performedBy,
          metadata: body.event.metadata,
        });
        return NextResponse.json({ success: true, message: 'Timeline event added' });

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Use: record_email, record_portal, update_status, or add_timeline_event',
          },
          { status: 400 }
        );
    }
  } catch (error) { 
    logger.error('Submission tracking error:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}

async function _GET(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { error: 'applicationId required' },
        { status: 400 }
      );
    }

    const submission = await getSubmissionHistory(applicationId);

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ submission });
  } catch (error) { 
    logger.error('Error fetching submission:', error);
    return NextResponse.json(
      { error: 'Operation failed' },
      { status: 500 }
    );
  }
}
export const GET = withApiAudit('/api/grants/submit', _GET);
export const POST = withApiAudit('/api/grants/submit', _POST);
