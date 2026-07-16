/**
 * Education E2E Workflow API
 * Program → Course → Module → Lesson → Competency → Assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get('program_id');
  const includeRelations = searchParams.get('include')?.split(',') || ['modules', 'courses', 'lessons', 'competencies', 'assessments'];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile?.role?.includes('admin') && profile?.role !== 'instructor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result: Record<string, unknown> = {};

    if (programId) {
      const { data: program } = await supabase.from('programs').select('*').eq('id', programId).single();
      result.program = program;
    } else {
      const { data: programs } = await supabase.from('programs').select('*').order('created_at', { ascending: false }).limit(20);
      result.programs = programs;
    }

    if (includeRelations.includes('modules')) {
      const query = programId ? supabase.from('program_modules').select('*').eq('program_id', programId) : supabase.from('program_modules').select('*').limit(50);
      const { data: modules } = await query.order('sort_order', { ascending: true });
      result.modules = modules;
    }

    if (includeRelations.includes('courses')) {
      const query = programId ? supabase.from('lms_courses').select('*').eq('program_id', programId) : supabase.from('lms_courses').select('*').limit(50);
      const { data: courses } = await query.order('created_at', { ascending: false });
      result.courses = courses;
    }

    if (includeRelations.includes('lessons')) {
      const { data: lessons } = await supabase.from('course_lessons').select('id, title, course_id, order_index, duration_minutes, lesson_type, is_published, competency_keys').order('order_index', { ascending: true }).limit(200);
      result.lessons = lessons;
    }

    if (includeRelations.includes('competencies')) {
      const { data: competencies } = await supabase.from('competency_definitions').select('*').limit(100);
      result.competencies = competencies;
    }

    if (includeRelations.includes('assessments')) {
      const { data: assessments } = await supabase.from('assessment_definitions').select('*').limit(100);
      result.assessments = assessments;
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Education workflow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile?.role?.includes('admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create_program': {
        const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const { data: program, error } = await supabase.from('programs').insert({ name: data.name, description: data.description, slug, status: 'draft' }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { program } }, { status: 201 });
      }
      case 'add_module': {
        const { data: module, error } = await supabase.from('program_modules').insert({ program_id: data.program_id, title: data.title, description: data.description, order_index: data.order_index ?? 0, is_published: false }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { module } }, { status: 201 });
      }
      case 'add_course': {
        const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const { data: course, error } = await supabase.from('lms_courses').insert({ title: data.title, description: data.description, program_id: data.program_id, slug, status: 'draft' }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { course } }, { status: 201 });
      }
      case 'add_lesson': {
        const { data: lesson, error } = await supabase.from('course_lessons').insert({ course_id: data.course_id, title: data.title, content: data.content, duration_minutes: data.duration_minutes, order_index: data.order_index ?? 0, lesson_type: data.lesson_type ?? 'lesson', is_published: false }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { lesson } }, { status: 201 });
      }
      case 'link_competency': {
        const { data: lesson } = await supabase.from('course_lessons').select('competency_keys').eq('id', data.lesson_id).single();
        const keys = lesson?.competency_keys || [];
        if (!keys.includes(data.competency_id)) keys.push(data.competency_id);
        const { data: updated, error } = await supabase.from('course_lessons').update({ competency_keys: keys }).eq('id', data.lesson_id).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { lesson: updated } });
      }
      case 'create_assessment': {
        const { data: assessment, error } = await supabase.from('assessment_definitions').insert({ name: data.name, description: data.description, assessment_type: data.assessment_type, passing_score: data.passing_score ?? 70, competency_ids: data.competency_ids || [], questions: data.questions || [] }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { assessment } }, { status: 201 });
      }
      case 'export_approval_packet': {
        const { data: program } = await supabase.from('programs').select('*').eq('id', data.program_id).single();
        const { data: modules } = await supabase.from('program_modules').select('*').eq('program_id', data.program_id).order('sort_order');
        const { data: courses } = await supabase.from('lms_courses').select('*').eq('program_id', data.program_id);
        const courseIds = courses?.map(c => c.id) || [];
        const { data: lessons } = await supabase.from('course_lessons').select('*').in('course_id', courseIds);
        const competencyIds = [...new Set(lessons?.flatMap(l => l.competency_keys || []) || [])];
        const { data: competencies } = await supabase.from('competency_definitions').select('*').in('id', competencyIds);
        const { data: assessments } = await supabase.from('assessment_definitions').select('*').overlaps('competency_ids', competencyIds);
        const packet = { exported_at: new Date().toISOString(), program, modules, courses, lessons, competencies, assessments, summary: { total_modules: modules?.length || 0, total_courses: courses?.length || 0, total_lessons: lessons?.length || 0, total_competencies: competencyIds.length, total_assessments: assessments?.length || 0 } };
        return NextResponse.json({ success: true, data: packet });
      }
      // === STUDENT LIFECYCLE ACTIONS ===
      case 'enroll_student': {
        const { data: enrollment, error } = await supabase.from('program_enrollments').insert({
          program_id: data.program_id,
          user_id: data.user_id,
          status: 'active',
          enrolled_at: new Date().toISOString(),
        }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { enrollment } }, { status: 201 });
      }
      case 'update_lesson_progress': {
        const { data: progress, error } = await supabase.from('lesson_progress').upsert({
          lesson_id: data.lesson_id,
          user_id: data.user_id,
          status: data.status || 'completed',
          completed_at: data.status === 'completed' ? new Date().toISOString() : null,
        }, { onConflict: 'lesson_id,user_id' }).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ success: true, data: { progress } });
      }
      case 'get_enrollment_progress': {
        const { data: enrollment } = await supabase.from('program_enrollments').select('*').eq('id', data.enrollment_id).single();
        const { data: progress } = await supabase.from('lesson_progress').select('*').eq('user_id', data.user_id);
        const courseIds = enrollment?.course_ids || [];
        const { data: lessons } = await supabase.from('course_lessons').select('id').in('course_id', courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000']);
        const lessonIds = lessons?.map(l => l.id) || [];
        const completedLessons = progress?.filter(p => p.status === 'completed' && lessonIds.includes(p.lesson_id)) || [];
        const percentage = lessonIds.length > 0 ? Math.round((completedLessons.length / lessonIds.length) * 100) : 0;
        return NextResponse.json({ success: true, data: { enrollment, progress, completedCount: completedLessons.length, totalLessons: lessonIds.length, percentage } });
      }
      case 'get_student_transcript': {
        const { data: enrollment } = await supabase.from('program_enrollments').select('*').eq('id', data.enrollment_id).single();
        const { data: progress } = await supabase.from('lesson_progress').select('*').eq('user_id', data.user_id);
        const { data: courses } = await supabase.from('lms_courses').select('*').eq('program_id', enrollment?.program_id);
        const courseIds = courses?.map(c => c.id) || [];
        const { data: lessons } = await supabase.from('course_lessons').select('*').in('course_id', courseIds.length ? courseIds : ['00000000-0000-0000-0000-000000000000']);
        const transcript = {
          student_id: data.user_id,
          program_id: enrollment?.program_id,
          enrolled_at: enrollment?.enrolled_at,
          completed_at: enrollment?.completed_at,
          status: enrollment?.status,
          courses: courses?.map(course => {
            const courseLessons = lessons?.filter(l => l.course_id === course.id) || [];
            const completed = progress?.filter(p => p.lesson_id && courseLessons.some(cl => cl.id === p.lesson_id) && p.status === 'completed') || [];
            return { course: course.title, total: courseLessons.length, completed: completed.length, percentage: courseLessons.length > 0 ? Math.round((completed.length / courseLessons.length) * 100) : 0 };
          }),
          total_lessons: lessons?.length || 0,
          completed_lessons: progress?.filter(p => p.status === 'completed').length || 0,
        };
        return NextResponse.json({ success: true, data: transcript });
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Education workflow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
