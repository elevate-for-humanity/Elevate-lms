import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

/**
 * Generate Videos for Course Lessons
 * 
 * POST /api/admin/generate-lesson-videos
 * Body: { courseId?: string, lessonId?: string, batchSize?: number }
 * 
 * If courseId provided: generates for all lessons in that course
 * If lessonId provided: generates for that specific lesson
 * If neither: generates for next batch of lessons without videos
 */

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    
    // Check admin auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, lessonId, batchSize = 5 } = await request.json();

    let lessons: any[] = [];

    if (lessonId) {
      // Single lesson
      const { data } = await supabase
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .eq('id', lessonId)
        .single();
      if (data) lessons = [data];
    } else if (courseId) {
      // All lessons for a course
      const { data } = await supabase
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .eq('course_id', courseId)
        .is('video_url', null)
        .order('lesson_number');
      lessons = data || [];
    } else {
      // Next batch without videos
      const { data } = await supabase
        .from('training_lessons')
        .select('*, training_courses(course_name)')
        .is('video_url', null)
        .order('created_at')
        .limit(batchSize);
      lessons = data || [];
    }

    if (lessons.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No lessons need video generation',
        generated: 0 
      });
    }

    const results: { lessonId: string; success: boolean; videoUrl?: string; error?: string }[] = [];

    for (const lesson of lessons) {
      try {
        const courseName = lesson.training_courses?.course_name || 'Course';
        
        // Generate video using the AI avatar endpoint
        const videoResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai-studio/generate-avatar`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: generateLessonScript(lesson, courseName),
              duration: Math.min(lesson.duration_minutes * 60, 180), // Max 3 min
              voice: 'alloy',
              avatar: 'instructor',
            }),
          }
        );

        if (!videoResponse.ok) {
          throw new Error('Video generation failed');
        }

        const videoData = await videoResponse.json();
        
        // Update lesson with video URL
        const { error: updateError } = await supabase
          .from('training_lessons')
          .update({ 
            video_url: videoData.videoUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', lesson.id);

        if (updateError) throw updateError;

        results.push({
          lessonId: lesson.id,
          success: true,
          videoUrl: videoData.videoUrl,
        });

        logger.info(`Generated video for lesson ${lesson.id}: ${lesson.title}`);

      } catch (error) {
        logger.error(`Failed to generate video for lesson ${lesson.id}:`, error);
        results.push({
          lessonId: lesson.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Rate limiting between generations
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Generated ${successful} videos, ${failed} failed`,
      generated: successful,
      failed,
      results,
    });

  } catch (error) {
    logger.error('Lesson video generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate videos' },
      { status: 500 }
    );
  }
}

function generateLessonScript(lesson: any, courseName: string): string {
  return `
Welcome to ${courseName}, Lesson ${lesson.lesson_number}: ${lesson.title}.

${lesson.content}

In this lesson, you will learn about: ${(lesson.topics || []).join(', ')}.

This lesson is approximately ${lesson.duration_minutes} minutes long. 
Let's get started with the key concepts.

${lesson.content.substring(0, 500)}

Remember to take notes and complete the quiz at the end of this lesson.
  `.trim();
}

// GET endpoint to check generation status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { count: total } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true });

    const { count: withVideos } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .not('video_url', 'is', null);

    const { count: withoutVideos } = await supabase
      .from('training_lessons')
      .select('*', { count: 'exact', head: true })
      .is('video_url', null);

    return NextResponse.json({
      total,
      withVideos,
      withoutVideos,
      percentComplete: total ? Math.round((withVideos || 0) / total * 100) : 0,
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
