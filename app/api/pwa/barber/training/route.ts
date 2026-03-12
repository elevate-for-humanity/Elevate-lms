import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCourseBySlug } from '@/lib/courses/definitions';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _GET(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get barber apprenticeship course definition
    const course = getCourseBySlug('barber-apprenticeship');
    
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get user's lesson progress from database
    const { data: lessonProgress } = await db
      .from('lesson_progress')
      .select('lesson_id, completed, completed_at')
      .eq('user_id', user.id)
      .eq('course_slug', 'barber-apprenticeship');

    const completedLessons = new Set(
      lessonProgress?.filter(p => p.completed).map(p => p.lesson_id) || []
    );

    // Get user's total hours to determine unlocked modules
    const { data: progressEntries } = await db
      .from('progress_entries')
      .select('hours_worked')
      .eq('apprentice_id', user.id)
      .eq('program_id', 'BARBER');

    const totalHours = progressEntries?.reduce(
      (sum, entry) => sum + parseFloat(entry.hours_worked || 0), 0
    ) || 0;

    // Module unlock thresholds based on hours
    const moduleUnlockThresholds: Record<string, number> = {
      'ba-01': 0,      // Orientation - always unlocked
      'ba-02': 0,      // Sanitation - always unlocked
      'ba-03': 100,    // Cutting & Fades I - after 100 hours
      'ba-04': 250,    // Cutting & Fades II - after 250 hours
      'ba-05': 500,    // Shaving - after 500 hours
      'ba-06': 750,    // Chemical Services - after 750 hours
      'ba-07': 1000,   // Business & Client Relations - after 1000 hours
      'ba-08': 2000,   // State Board Prep - after 2000 hours
    };

    // Transform modules with progress data
    const modules = course.modules.map(module => {
      const unlockThreshold = moduleUnlockThresholds[module.id] ?? 0;
      const isLocked = totalHours < unlockThreshold;
      
      const lessonsWithProgress = module.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        type: lesson.type,
        duration: lesson.durationMinutes ? `${lesson.durationMinutes} min` : undefined,
        description: lesson.description,
        completed: completedLessons.has(lesson.id),
        contentUrl: lesson.contentUrl,
      }));

      const completedCount = lessonsWithProgress.filter(l => l.completed).length;

      return {
        id: module.id,
        title: module.title,
        description: module.description,
        lessons: lessonsWithProgress.length,
        completed: completedCount,
        locked: isLocked,
        unlockAt: unlockThreshold,
        chapters: lessonsWithProgress,
      };
    });

    // Calculate overall progress
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons, 0);
    const totalCompleted = modules.reduce((sum, m) => sum + m.completed, 0);

    return NextResponse.json({
      course: {
        title: course.course_name,
        subtitle: course.subtitle,
        partner: course.partner,
        estimatedWeeks: course.estimatedDurationWeeks,
      },
      modules,
      progress: {
        totalLessons,
        completedLessons: totalCompleted,
        percentComplete: totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0,
      },
      apprenticeHours: totalHours,
    });
  } catch (error) {
    logger.error('Error fetching training data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mark a lesson as complete
async function _POST(request: Request) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lessonId, completed } = await request.json();

    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
    }

    const { error } = await db
      .from('lesson_progress')
      .upsert({
        user_id: user.id,
        course_slug: 'barber-apprenticeship',
        lesson_id: lessonId,
        completed: completed ?? true,
        completed_at: completed ? new Date().toISOString() : null,
      }, {
        onConflict: 'user_id,course_slug,lesson_id',
      });

    if (error) {
      logger.error('Error updating lesson progress:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating lesson progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/pwa/barber/training', _GET);
export const POST = withApiAudit('/api/pwa/barber/training', _POST);
