
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// app/api/live/zoom/route.ts
// API endpoint for instructors to schedule Zoom live sessions
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from "@/lib/supabase-api";
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { logAuditEvent, getRequestMetadata } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createSupabaseClient();
  try {
    const { courseId, topic, startTime, durationMinutes, instructorZoomId, tenantId } = await request.json();

    if (!courseId || !topic || !startTime || !durationMinutes) {
      return NextResponse.json(
        { error: 'courseId, topic, startTime, durationMinutes are required' },
        { status: 400 }
      );
    }

    if (!instructorZoomId) {
      return NextResponse.json(
        { error: 'Instructor must be linked to Zoom account' },
        { status: 400 }
      );
    }

    // Create Zoom meeting
    const meeting = await createZoomMeeting(instructorZoomId, {
      topic,
      startTime,
      durationMinutes,
    });

    // Save to database
    const { data: liveSession, error } = await db
      .from('live_sessions')
      .insert({
        course_id: courseId,
        tenant_id: tenantId || null,
        topic,
        start_time: new Date(startTime).toISOString(),
        duration_minutes: durationMinutes,
        join_url: meeting.join_url,
        start_url: meeting.start_url,
        provider: 'zoom',
        provider_meeting_id: String(meeting.id),
      })
      .select()
      .single();

    if (error) {
      logger.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save live session' },
        { status: 500 }
      );
    }

    // Log audit event
    const { ipAddress, userAgent } = getRequestMetadata(request);
    await logAuditEvent({
      tenantId: tenantId || null,
      userId: null, // Note: Get from session
      action: 'live_session_created',
      resourceType: 'live_session',
      resourceId: liveSession.id,
      metadata: { topic, provider: 'zoom', meetingId: meeting.id },
      ipAddress,
      userAgent
    });

    return NextResponse.json({ liveSession, meeting });
  } catch (error) { 
    logger.error('Zoom meeting creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
