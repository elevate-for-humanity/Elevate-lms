import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;


export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const sessionId = formData.get('sessionId');

    if (!(file instanceof File) || typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ error: 'file and sessionId are required' }, { status: 400 });
    }

    const ext = file.name?.split('.').pop()?.toLowerCase() || 'webm';
    const path = `exam-recordings/${sessionId}/${Date.now()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage.from('media').upload(path, arrayBuffer, {
      contentType: file.type || 'video/webm',
      upsert: false,
    });

    if (uploadError) {
      logger.error('Upload failed', undefined, { detail: uploadError.message });
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(path);

    const publicUrl = publicUrlData?.publicUrl ?? null;

    const { error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        recording_url: publicUrl,
        evidence_url: publicUrl,
      })
      .eq('id', sessionId);

    if (updateError) {
      logger.error('Update failed', undefined, { detail: updateError.message });
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, path, publicUrl });
  } catch (error) {
    logger.error('POST /api/exams/upload-recording failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
