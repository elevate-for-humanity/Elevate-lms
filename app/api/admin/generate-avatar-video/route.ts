
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createTalk, pollTalkResult } from '@/lib/d-id/generate-talk';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 300;

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/generate-avatar-video
 *
 * Generates a D-ID talking-head video from Elizabeth Greene's headshot
 * and audio file(s). Supports two modes:
 *
 * Single file:
 *   { "audioUrl": "https://…/audio/orientation-full.mp3" }
 *
 * Chunked (if D-ID rejects long audio):
 *   { "audioUrls": [
 *       "https://…/audio/orientation-parts/part-000.mp3",
 *       "https://…/audio/orientation-parts/part-001.mp3",
 *       ...
 *     ]
 *   }
 *
 * Returns result_url(s) for the generated MP4(s).
 * For chunked mode, concatenate the MP4s with ffmpeg:
 *   ffmpeg -f concat -safe 0 -i concat.txt -c copy orientation-guide.mp4
 */
/**
 * Disabled by default. Enable temporarily via env var when generating
 * a new avatar video, then disable again.
 *
 *   AVATAR_GEN_ENABLED=true  → endpoint active
 *   AVATAR_GEN_ENABLED unset → 404
 */

async function _POST(req: NextRequest) {
  if (process.env.AVATAR_GEN_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const supabase = await createClient();
  
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { audioUrl, audioUrls } = body;

    // Validate input — exactly one of audioUrl or audioUrls
    if (!audioUrl && (!audioUrls || !Array.isArray(audioUrls) || audioUrls.length === 0)) {
      return NextResponse.json(
        { error: 'Provide either audioUrl (single file) or audioUrls (array of chunks)' },
        { status: 400 }
      );
    }

    // Strict domain whitelist — hardcoded, not config-driven
    const allowedOrigins = new Set([
      'https://www.elevateforhumanity.org',
      'https://elevateforhumanity.org',
    ]);
    const urlsToCheck = audioUrl ? [audioUrl] : audioUrls;
    for (const url of urlsToCheck) {
      try {
        const origin = new URL(url).origin;
        if (!allowedOrigins.has(origin)) {
          return NextResponse.json(
            { error: `Audio URL must be from elevateforhumanity.org, got: ${origin}` },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
      }
    }
    const photoUrl = 'https://www.elevateforhumanity.org/images/team/elizabeth-greene-headshot.jpg';

    // Single file mode
    if (audioUrl) {
      const talk = await createTalk({ photoUrl, audioUrl });
      const result = await pollTalkResult(talk.id, 60, 5000);

      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        actor_role: profile.role,
        action: 'generate_avatar_video',
        resource_type: 'avatar_video',
        resource_id: talk.id,
        after_state: { talk_id: talk.id, audio_url: audioUrl, result_url: result.result_url },
      });

      return NextResponse.json({
        mode: 'single',
        talkId: talk.id,
        status: result.status,
        resultUrl: result.result_url,
        next: 'Download MP4 → replace public/videos/avatars/orientation-guide.mp4',
      });
    }

    // Chunked mode — generate one talk per audio chunk
    const results: Array<{ part: number; talkId: string; status: string; resultUrl?: string; error?: string }> = [];

    for (let i = 0; i < audioUrls.length; i++) {
      try {
        const talk = await createTalk({ photoUrl, audioUrl: audioUrls[i] });
        const result = await pollTalkResult(talk.id, 60, 5000);
        results.push({
          part: i,
          talkId: talk.id,
          status: result.status,
          resultUrl: result.result_url,
        });
      } catch (err) {
        results.push({
          part: i,
          talkId: '',
          status: 'error',
          error: 'Video generation failed',
        });
      }
    }

    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_role: profile.role,
      action: 'generate_avatar_video_batch',
      resource_type: 'avatar_video',
      resource_id: `batch-${Date.now()}`,
      after_state: { parts: results.length, results },
    });

    // Build concat instructions
    const successParts = results.filter((r) => r.resultUrl);
    const concatInstructions = successParts.length > 1
      ? [
          'Download all MP4s, then concatenate:',
          '1. Create concat.txt with lines: file \'part-000.mp4\' etc.',
          '2. ffmpeg -f concat -safe 0 -i concat.txt -c copy orientation-guide.mp4',
          '3. Replace public/videos/avatars/orientation-guide.mp4',
        ]
      : ['Download the single MP4 → replace public/videos/avatars/orientation-guide.mp4'];

    return NextResponse.json({
      mode: 'chunked',
      totalParts: audioUrls.length,
      succeeded: successParts.length,
      failed: results.filter((r) => r.status === 'error').length,
      results,
      next: concatInstructions,
    });
  } catch (error) {
    logger.error('Avatar video generation failed', error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/admin/generate-avatar-video', _POST);
