import { z } from 'zod';
import { requireAdminClient } from '../supabase/admin';

const ModuleSchema = z.object({
  type: z.literal('module'),
  courseId: z.string().uuid(),
  title: z.string().min(1).max(200),
});
const LessonSchema = z.object({
  type: z.literal('lesson'),
  courseId: z.string().uuid(),
  moduleId: z.string().uuid(),
  title: z.string().min(1).max(200),
  stepType: z.enum(['lesson','quiz','checkpoint','lab','assignment','exam','certification']).default('lesson'),
});
const BodySchema = z.discriminatedUnion('type', [ModuleSchema, LessonSchema]);

function slugify(title: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)}-${Date.now().toString(36)}`;
}

export async function quickAddCourseItem(input: unknown) {
  const body = BodySchema.parse(input);
  const db = await requireAdminClient();

  if (body.type === 'module') {
    const { data: existing } = await db
      .from('course_modules')
      .select('order_index')
      .eq('course_id', body.courseId)
      .order('order_index', { ascending: false })
      .limit(1);
    const nextOrder = Number(existing?.[0]?.order_index ?? 0) + 1;
    const { data, error } = await db
      .from('course_modules')
      .insert({ course_id: body.courseId, title: body.title, slug: slugify(body.title), order_index: nextOrder })
      .select('id,title,slug,order_index')
      .single();
    if (error) throw error;
    return { type: 'module' as const, module: { ...data, module_order: data.order_index } };
  }

  const { data: existing } = await db
    .from('course_lessons')
    .select('order_index')
    .eq('module_id', body.moduleId)
    .order('order_index', { ascending: false })
    .limit(1);
  const nextOrder = Number(existing?.[0]?.order_index ?? 0) + 1;
  const { data, error } = await db
    .from('course_lessons')
    .insert({
      course_id: body.courseId,
      module_id: body.moduleId,
      title: body.title,
      slug: slugify(body.title),
      order_index: nextOrder,
      lesson_type: body.stepType,
      status: 'draft',
      content: '',
    })
    .select('id,title,slug,order_index,lesson_type,content,video_url,duration_minutes,passing_score,status')
    .single();
  if (error) throw error;
  return {
    type: 'lesson' as const,
    lesson: {
      id: data.id,
      title: data.title,
      slug: data.slug,
      lesson_order: data.order_index,
      step_type: data.lesson_type ?? 'lesson',
      content: data.content ?? '',
      video_url: data.video_url ?? '',
      duration_minutes: data.duration_minutes,
      passing_score: data.passing_score,
      status: data.status ?? 'draft',
    },
  };
}
