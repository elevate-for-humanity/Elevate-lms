import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { getVideoById, VideoPlaybackEvent } from '@/lib/video/registry';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Video Playback Events API
 * 
 * Instruments video playback for analytics and debugging:
 * - load_start: Video started loading
 * - can_play: Video ready to play
 * - play: Playback started
 * - pause: Playback paused
 * - ended: Video completed
 * - error: Playback error occurred
 * - progress: Periodic progress update
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    
    const event: VideoPlaybackEvent = {
      event_type: body.event_type,
      video_id: body.video_id,
      page_slug: body.page_slug,
      timestamp: new Date().toISOString(),
      current_time: body.current_time,
      duration: body.duration,
      error_message: body.error_message,
      user_id: body.user_id,
      session_id: body.session_id || generateSessionId(),
    };

    // Validate video exists in registry
    const video = getVideoById(event.video_id);
    if (!video) {
      logger.warn('Video playback event for unknown video', { video_id: event.video_id });
    }

    // Log event for analytics
    logger.info('Video playback event', {
      event_type: event.event_type,
      video_id: event.video_id,
      page_slug: event.page_slug,
      current_time: event.current_time,
      duration: event.duration,
      error_message: event.error_message,
    });

    // Store in database if available
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (supabase) {
      try {
        await db.from('video_playback_events').insert({
          event_type: event.event_type,
          video_id: event.video_id,
          page_slug: event.page_slug,
          current_time: event.current_time,
          duration: event.duration,
          error_message: event.error_message,
          user_id: event.user_id,
          session_id: event.session_id,
          created_at: event.timestamp,
        });
      } catch (dbError) {
        // Table may not exist yet, log but don't fail
        logger.debug('Could not store video event in database', { error: dbError });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Video events API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

function generateSessionId(): string {
  return `vs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
