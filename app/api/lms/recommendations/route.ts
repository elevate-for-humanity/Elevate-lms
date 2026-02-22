export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { recommendationEngine } from '@/lib/recommendations/engine';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

/**
 * GET /api/lms/recommendations — Get personalized course recommendations
 */
export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user profile data for recommendations
    const { data: profile } = await db
      .from('profiles')
      .select('interests, skill_level, learning_style')
      .eq('id', user.id)
      .single();

    // Fetch completed courses
    const { data: completedEnrollments } = await db
      .from('program_enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    // Fetch available courses
    const { data: courses } = await db
      .from('training_courses')
      .select('id, title, description, category, difficulty, duration_hours, rating')
      .eq('published', true)
      .limit(100);

    const userProfile = {
      id: user.id,
      interests: profile?.interests || [],
      completedCourses: (completedEnrollments || []).map((e: any) => e.course_id),
      skillLevel: profile?.skill_level || 1,
      learningStyle: profile?.learning_style || 'visual',
    };

    const courseCatalog = (courses || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description || '',
      category: c.category || 'general',
      difficulty: c.difficulty || 1,
      duration: c.duration_hours || 0,
      rating: c.rating || 0,
      tags: [],
    }));

    const recommendations = recommendationEngine.getRecommendations(userProfile, courseCatalog);

    return NextResponse.json({ recommendations });
  } catch (error) {
    logger.error('Recommendations API error', error as Error);
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
  }
}
