import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { generateTextToSpeech, VOICE_OPTIONS } from '@/server/tts-service';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminRole } from '@/lib/api/requireAdminRole';
import { createClient } from '@/lib/supabase/server';

/**
 * Text-to-Speech API
 * POST: Generate speech audio from text
 * GET: List available voices
 */

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const adminCheck = await requireAdminRole();
    if (adminCheck) return adminCheck;

    const { text, voice = 'onyx', speed = 1.0, lessonId } = await request.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    if (text.length > 4096) {
      return NextResponse.json({ error: 'Text must be 4096 characters or less' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Create task record (status: running)
    const { data: task } = await supabase.from('ai_generation_tasks').insert({
      task_type: 'tts',
      status: 'running',
      input_config: { text: text.substring(0, 200), voice, speed, lessonId },
      created_by: user?.id,
    }).select('id').single();

    // 2. Generate audio
    let audioBuffer: Buffer;
    try {
      audioBuffer = await generateTextToSpeech(text, voice, speed);
    } catch (genError) {
      // Update task as failed
      if (task?.id) {
        await supabase.from('ai_generation_tasks').update({
          status: 'failed',
          error_message: genError instanceof Error ? genError.message : 'Generation failed',
          completed_at: new Date().toISOString(),
        }).eq('id', task.id);
      }
      throw genError;
    }

    // 3. Upload to storage
    const filename = `tts-${Date.now()}-${voice}.mp3`;
    const storagePath = lessonId ? `lessons/${lessonId}/${filename}` : `tts/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, audioBuffer, { contentType: 'audio/mpeg', upsert: false });

    if (uploadError) {
      logger.error('TTS storage upload failed:', uploadError);
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath);
    const audioUrl = urlData.publicUrl;

    // 4. Persist to tts_audio_files
    await supabase.from('tts_audio_files').insert({
      text_input: text,
      voice,
      speed,
      storage_path: storagePath,
      audio_url: audioUrl,
      file_size_bytes: audioBuffer.length,
      lesson_id: lessonId || null,
      created_by: user?.id,
    });

    // 5. Update task as completed
    if (task?.id) {
      await supabase.from('ai_generation_tasks').update({
        status: 'completed',
        output_result: { storagePath, audioUrl, fileSize: audioBuffer.length },
        completed_at: new Date().toISOString(),
      }).eq('id', task.id);
    }

    return NextResponse.json({
      success: true,
      taskId: task?.id,
      voice,
      speed,
      textLength: text.length,
      audioSize: audioBuffer.length,
      storagePath,
      audioUrl,
    });
  } catch (error) {
    logger.error('TTS generation error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate speech' },
      { status: 500 }
    );
  }
}

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'public');
  if (rateLimited) return rateLimited;

  return NextResponse.json({
    voices: Object.entries(VOICE_OPTIONS).map(([id, info]) => ({
      id,
      ...info,
    })),
    limits: {
      maxTextLength: 4096,
      speedRange: { min: 0.25, max: 4.0 },
    },
  });
}

export const GET = withApiAudit('/api/ai/tts', _GET);
export const POST = withApiAudit('/api/ai/tts', _POST);
