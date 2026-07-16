/**
 * API Route: Generate Course Videos
 * 
 * POST /api/course/video-generate
 * 
 * Triggers automated video generation for a course.
 * Videos are created using Pexels B-roll + AI narration.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { generateCourseVideos, queueCourseVideoGeneration } from '@/lib/video/auto-video-generator';

// Supabase client for server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, lessonIds, mode = 'sync' } = body;
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }
    
    const supabase = createPublicClient()supabaseUrl, supabaseServiceKey);
    
    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, category, program_id')
      .eq('id', courseId)
      .single();
    
    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }
    
    // Get lessons
    let lessonsQuery = supabase
      .from('course_lessons')
      .select('id, title, content, module_name, order_index')
      .eq('course_id', courseId);
    
    if (lessonIds && lessonIds.length > 0) {
      lessonsQuery = lessonsQuery.in('id', lessonIds);
    }
    
    const { data: lessons, error: lessonsError } = await lessonsQuery.order('order_index');
    
    if (lessonsError || !lessons) {
      return NextResponse.json(
        { error: 'Failed to fetch lessons' },
        { status: 500 }
      );
    }
    
    if (lessons.length === 0) {
      return NextResponse.json(
        { error: 'No lessons found for this course' },
        { status: 404 }
      );
    }
    
    // Get program category for video search
    let category = course.category || 'default';
    
    if (course.program_id) {
      const { data: program } = await supabase
        .from('programs')
        .select('slug')
        .eq('id', course.program_id)
        .single();
      
      if (program?.slug) {
        category = program.slug;
      }
    }
    
    // Queue for async processing or run sync
    if (mode === 'async') {
      const { jobId } = await queueCourseVideoGeneration(courseId, supabaseUrl, supabaseServiceKey);
      
      return NextResponse.json({
        success: true,
        mode: 'async',
        jobId,
        courseId,
        totalLessons: lessons.length,
        message: 'Video generation queued. Check job status at /api/course/video-status/[jobId]',
      });
    }
    
    // Sync mode - generate immediately
    console.info(`\n🎬 Generating videos for course: ${course.title}`);
    console.info(`   Lessons: ${lessons.length}`);
    console.info(`   Category: ${category}`);
    
    const result = await generateCourseVideos(
      courseId,
      lessons.map(l => ({
        id: l.id,
        title: l.title,
        content: l.content || '',
        module_name: l.module_name || '',
        order_index: l.order_index,
      })),
      category
    );
    
    // Update lesson video URLs in database
    for (const video of result.videos) {
      if (video.status === 'success' && video.videoUrl) {
        await supabase
          .from('course_lessons')
          .update({ video_url: video.videoUrl })
          .eq('id', video.lessonId);
      }
    }
    
    return NextResponse.json({
      success: true,
      mode: 'sync',
      courseId,
      courseTitle: course.title,
      totalLessons: result.totalLessons,
      successful: result.successful,
      failed: result.failed,
    });
    
  } catch (error: any) {
    console.error('Video generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Video generation failed' },
      { status: 500 }
    );
  }
}
