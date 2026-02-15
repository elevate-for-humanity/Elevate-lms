
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient();
  const { courseId } = await params;

  const { data, error }: any = await supabase
    .from('course_announcements')
    .select('id, title, body, created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('announcements GET error', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  return NextResponse.json({ announcements: data || [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await params;
  const body = await req.json();
  const { title, message } = body;

  if (!title || !message) {
    return NextResponse.json(
      { error: 'title and message are required' },
      { status: 400 }
    );
  }

  // Optional: verify user is instructor for this course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    logger.error(courseError);
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  if (course.instructor_id && course.instructor_id !== user.id) {
    return NextResponse.json(
      { error: 'Only the instructor can post announcements' },
      { status: 403 }
    );
  }

  // Insert announcement
  const { error: insertError } = await supabase
    .from('course_announcements')
    .insert({
      course_id: courseId,
      author_id: user.id,
      title,
      body: message,
    });

  if (insertError) {
    logger.error('announcements POST error', insertError);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  // Optional: create notifications for enrolled students
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id')
    .eq('course_id', courseId);

  if (enrollments && enrollments.length) {
    const notifications = enrollments.map((e) => ({
      user_id: e.user_id,
      type: 'announcement',
      title: `New announcement: ${title}`,
      body: message.slice(0, 160),
      url: `/lms/courses/${courseId}`,
    }));

    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) {
      logger.error('notifications error', notifError);
    }
  }

  return NextResponse.json({ success: true });
}
