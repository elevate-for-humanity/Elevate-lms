export const runtime = 'edge';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { apiRequireAdmin } from '@/lib/authGuards';
import { logger } from '@/lib/logger';
import {
  reportContent,
  getPendingReports,
  getContentReports,
  reviewReport,
  moderateContent,
  getModerationStats,
  getModeratorPerformance,
  type ContentType,
  type ReportReason,
  type ModerationAction,
} from '@/lib/contentModeration';

export async function GET(request: NextRequest) {
  try {
    const authResult = await apiRequireAdmin();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'pending': {
        const contentType = searchParams.get(
          'contentType'
        ) as ContentType | null;
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const reports = await getPendingReports(
          contentType || undefined,
          limit
        );
        return NextResponse.json({ reports });
      }

      case 'content': {
        const type = searchParams.get('type') as ContentType;
        const contentId = searchParams.get('contentId');
        if (!type || !contentId) {
          return NextResponse.json(
            { error: 'type and contentId required' },
            { status: 400 }
          );
        }
        const contentReports = await getContentReports(type, contentId);
        return NextResponse.json({ reports: contentReports });
      }

      case 'stats': {
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const stats = await getModerationStats(startDate, endDate);
        return NextResponse.json({ stats });
      }

      case 'performance': {
        const moderatorId = searchParams.get('moderatorId') || user.id;
        const perfStartDate = searchParams.get('startDate') || undefined;
        const perfEndDate = searchParams.get('endDate') || undefined;
        const performance = await getModeratorPerformance(
          moderatorId,
          perfStartDate,
          perfEndDate
        );
        return NextResponse.json({ performance });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { /* Error handled silently */ 
    logger.error('Moderation GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch moderation data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await apiRequireAdmin();

    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user } = authResult;
    const body = await parseBody<Record<string, any>>(request);
    const { action } = body;

    switch (action) {
      case 'report': {
        const { contentType, contentId, reason, description } = body;
        if (!contentType || !contentId || !reason) {
          return NextResponse.json(
            { error: 'contentType, contentId, and reason required' },
            { status: 400 }
          );
        }
        const report = await reportContent(
          contentType as ContentType,
          contentId,
          user.id,
          reason as ReportReason,
          description
        );
        return NextResponse.json({ success: true, report });
      }

      case 'review': {
        const { reportId, moderationAction, notes } = body;
        if (!reportId || !moderationAction) {
          return NextResponse.json(
            { error: 'reportId and moderationAction required' },
            { status: 400 }
          );
        }
        await reviewReport(
          reportId,
          user.id,
          moderationAction as ModerationAction,
          notes
        );
        return NextResponse.json({ success: true });
      }

      case 'moderate': {
        const { type, id, moderationAction: action2, moderatorNotes } = body;
        if (!type || !id || !action2) {
          return NextResponse.json(
            { error: 'type, id, and moderationAction required' },
            { status: 400 }
          );
        }
        await moderateContent(
          type as ContentType,
          id,
          action2 as ModerationAction,
          user.id,
          moderatorNotes
        );
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { /* Error handled silently */ 
    logger.error('Moderation POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process moderation action' },
      { status: 500 }
    );
  }
}
