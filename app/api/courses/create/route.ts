import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();

    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or instructor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'instructor'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin or Instructor role required' },
        { status: 403 }
      );
    }

    const courseData = await request.json();

    // Generate slug from title
    const slug = courseData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Insert course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        slug,
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        level: courseData.level,
        duration: courseData.duration,
        funding_programs: courseData.fundingPrograms || ['WIOA'],
        status: 'draft',
        total_lessons: courseData.modules.reduce(
          (acc: number, m: { lessons: any[] }) => acc + m.lessons.length,
          0
        ),
      })
      .select()
      .single();

    if (courseError) {
      logger.error('Course creation error:', courseError);
      return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
    }

    // Insert modules and lessons
    for (
      let moduleIndex = 0;
      moduleIndex < courseData.modules.length;
      moduleIndex++
    ) {
      const moduleData = courseData.modules[moduleIndex];

      // Insert lessons for this module
      for (
        let lessonIndex = 0;
        lessonIndex < moduleData.lessons.length;
        lessonIndex++
      ) {
        const lessonData = moduleData.lessons[lessonIndex];

        const { error: lessonError } = await supabase.from('lessons').insert({
          course_id: course.id,
          title: lessonData.title,
          description: moduleData.description || '',
          content: lessonData.content || '',
          video_url: lessonData.type === 'video' ? lessonData.content : null,
          duration_minutes: lessonData.duration || 0,
          order_index: moduleIndex * 100 + lessonIndex,
          is_preview: lessonIndex === 0,
        });

        if (lessonError) {
          logger.error('Lesson creation error:', lessonError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      course: {
        id: course.id,
        slug: course.slug,
        title: course.course_name,
      },
    });
  } catch (error) { 
    logger.error(
      'Course creation error:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Failed to create course' },
      { status: 500 }
    );
  }
}
