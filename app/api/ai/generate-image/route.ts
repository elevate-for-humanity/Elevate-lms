import { NextRequest, NextResponse } from 'next/server';


import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { aiGenerateImage } from '@/lib/ai/ai-service';
import { generateCourseHero, generateLessonThumbnail, generateCertificateBackground } from '@/lib/ai/image-generator';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { requireAdminRole } from '@/lib/api/requireAdminRole';
import { createClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Image Generation API
 * Supports: freeform prompt, course hero, lesson thumbnail, certificate background
 */

async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

    const adminCheck = await requireAdminRole();
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const {
      mode = 'freeform',
      prompt,
      courseName,
      lessonTitle,
      programName,
      category,
      size = '1024x1024',
      quality = 'standard',
      style = 'natural',
      storagePath: customPath,
    } = body;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const effectivePrompt = prompt || courseName || lessonTitle || programName || 'image';

    // 1. Create task record
    const { data: task } = await supabase.from('ai_generation_tasks').insert({
      task_type: 'image',
      status: 'running',
      input_config: { mode, prompt: effectivePrompt.substring(0, 200), size, quality, style },
      created_by: user?.id,
    }).select('id').single();

    // 2. Generate image
    let images;
    try {
      switch (mode) {
        case 'course-hero':
          if (!courseName) return NextResponse.json({ error: 'courseName required for course-hero mode' }, { status: 400 });
          images = await generateCourseHero(courseName, category);
          break;
        case 'lesson-thumbnail':
          if (!lessonTitle) return NextResponse.json({ error: 'lessonTitle required for lesson-thumbnail mode' }, { status: 400 });
          images = await generateLessonThumbnail(lessonTitle, category);
          break;
        case 'certificate':
          if (!programName) return NextResponse.json({ error: 'programName required for certificate mode' }, { status: 400 });
          images = await generateCertificateBackground(programName);
          break;
        case 'freeform':
        default:
          if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
          images = await aiGenerateImage({ prompt, size, quality, style });
          break;
      }
    } catch (genError) {
      if (task?.id) {
        await supabase.from('ai_generation_tasks').update({
          status: 'failed',
          error_message: genError instanceof Error ? genError.message : 'Generation failed',
          completed_at: new Date().toISOString(),
        }).eq('id', task.id);
      }
      throw genError;
    }

    if (!images || images.length === 0) {
      if (task?.id) {
        await supabase.from('ai_generation_tasks').update({
          status: 'failed', error_message: 'No images returned', completed_at: new Date().toISOString(),
        }).eq('id', task.id);
      }
      return NextResponse.json({ error: 'No images generated' }, { status: 500 });
    }

    // 3. Upload to storage + persist metadata
    let permanentUrl = images[0].url;
    let finalStoragePath = '';
    let fileSize = 0;

    if (images[0].url) {
      try {
        const imageResponse = await fetch(images[0].url);
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        fileSize = imageBuffer.length;
        finalStoragePath = customPath || `generated/images/${mode}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(finalStoragePath, imageBuffer, { contentType: 'image/png', upsert: true });

        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(finalStoragePath);
          permanentUrl = urlData.publicUrl;
        }
      } catch (storageErr) {
        logger.error('Image storage upload failed:', storageErr instanceof Error ? storageErr : new Error(String(storageErr)));
      }
    }

    // 4. Persist to generated_images
    const { data: imageRecord } = await supabase.from('generated_images').insert({
      prompt: effectivePrompt,
      provider: 'openai',
      model: 'dall-e-3',
      size,
      quality,
      style,
      image_url: permanentUrl,
      storage_path: finalStoragePath,
      file_size_bytes: fileSize,
      metadata: { mode, category },
      created_by: user?.id,
    }).select('id').single();

    // 5. Complete task
    if (task?.id) {
      await supabase.from('ai_generation_tasks').update({
        status: 'completed',
        output_result: { imageId: imageRecord?.id, imageUrl: permanentUrl, storagePath: finalStoragePath },
        completed_at: new Date().toISOString(),
      }).eq('id', task.id);
    }

    return NextResponse.json({
      success: true,
      taskId: task?.id,
      imageId: imageRecord?.id,
      mode,
      images: images.map(img => ({ ...img, storagePath: finalStoragePath, permanentUrl })),
    });
  } catch (error) {
    logger.error('Image generation error:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to generate image' },
      { status: 500 }
    );
  }
}

export const POST = withApiAudit('/api/ai/generate-image', _POST);
