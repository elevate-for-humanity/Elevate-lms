import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !serviceRoleKey || !openaiKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY',
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const openai = new OpenAI({ apiKey: openaiKey });

const MODEL = 'text-embedding-3-small';
const MAX_CHARS = 12000;

type Source = {
  course_id: string;
  module_id?: string | null;
  lesson_id?: string | null;
  content_type: 'course' | 'module' | 'lesson';
  source_text: string;
  metadata: Record<string, unknown>;
};

function normalizeText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function compact(parts: unknown[]): string {
  return parts
    .map(normalizeText)
    .map((part) => part.trim())
    .filter(Boolean)
    .join('\n\n')
    .slice(0, MAX_CHARS);
}

async function alreadyEmbedded(source: Source): Promise<boolean> {
  let query = supabase
    .from('course_embeddings')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', source.course_id)
    .eq('content_type', source.content_type);

  if (source.lesson_id) query = query.eq('lesson_id', source.lesson_id);
  else query = query.is('lesson_id', null);

  if (source.module_id) query = query.eq('module_id', source.module_id);
  else query = query.is('module_id', null);

  const { count, error } = await query;
  if (error) throw error;
  return (count ?? 0) > 0;
}

async function embed(source: Source): Promise<'inserted' | 'skipped'> {
  if (!source.source_text.trim()) return 'skipped';
  if (await alreadyEmbedded(source)) return 'skipped';

  const result = await openai.embeddings.create({
    model: MODEL,
    input: source.source_text,
  });
  const embedding = result.data[0]?.embedding;
  if (!embedding) throw new Error('Embedding provider returned no vector');

  const { error } = await supabase.from('course_embeddings').insert({
    course_id: source.course_id,
    module_id: source.module_id ?? null,
    lesson_id: source.lesson_id ?? null,
    content_type: source.content_type,
    source_text: source.source_text,
    embedding,
    metadata: source.metadata,
    model: MODEL,
  });
  if (error) throw error;
  return 'inserted';
}

async function main() {
  const { data: courses, error: courseError } = await supabase
    .from('courses')
    .select(
      'id,slug,title,course_name,short_description,description,status,is_active,published_at,governing_body,governing_region,governing_standard_version',
    )
    .or('published_at.not.is.null,status.eq.published');
  if (courseError) throw courseError;

  let inserted = 0;
  let skipped = 0;

  for (const course of courses ?? []) {
    const courseTitle = course.title || course.course_name || course.slug || 'Untitled course';
    const courseText = compact([
      `Course: ${courseTitle}`,
      course.short_description,
      course.description,
      course.governing_body && `Governing body: ${course.governing_body}`,
      course.governing_region && `Region: ${course.governing_region}`,
      course.governing_standard_version && `Standard version: ${course.governing_standard_version}`,
    ]);

    const courseResult = await embed({
      course_id: course.id,
      content_type: 'course',
      source_text: courseText,
      metadata: { title: courseTitle, slug: course.slug, source: 'courses' },
    });
    courseResult === 'inserted' ? inserted++ : skipped++;

    const { data: modules, error: moduleError } = await supabase
      .from('course_modules')
      .select('id,title,description,content,slug,order_index,is_published')
      .eq('course_id', course.id);
    if (moduleError) throw moduleError;

    for (const module of modules ?? []) {
      const moduleText = compact([
        `Course: ${courseTitle}`,
        `Module: ${module.title || module.slug || module.id}`,
        module.description,
        module.content,
      ]);
      const moduleResult = await embed({
        course_id: course.id,
        module_id: module.id,
        content_type: 'module',
        source_text: moduleText,
        metadata: {
          title: module.title,
          slug: module.slug,
          order_index: module.order_index,
          source: 'course_modules',
        },
      });
      moduleResult === 'inserted' ? inserted++ : skipped++;
    }

    const { data: lessons, error: lessonError } = await supabase
      .from('course_lessons')
      .select(
        'id,module_id,slug,title,content,content_json,rendered_html,script_text,script,learning_objectives,key_terms,scenario_prompt,competency_checks,instructor_notes,lesson_type,order_index,is_published,status',
      )
      .eq('course_id', course.id);
    if (lessonError) throw lessonError;

    for (const lesson of lessons ?? []) {
      const lessonText = compact([
        `Course: ${courseTitle}`,
        `Lesson: ${lesson.title || lesson.slug || lesson.id}`,
        lesson.content,
        lesson.content_json,
        lesson.rendered_html,
        lesson.script_text,
        lesson.script,
        lesson.learning_objectives,
        lesson.key_terms,
        lesson.scenario_prompt,
        lesson.competency_checks,
        lesson.instructor_notes,
      ]);
      const lessonResult = await embed({
        course_id: course.id,
        module_id: lesson.module_id,
        lesson_id: lesson.id,
        content_type: 'lesson',
        source_text: lessonText,
        metadata: {
          title: lesson.title,
          slug: lesson.slug,
          lesson_type: lesson.lesson_type,
          order_index: lesson.order_index,
          source: 'course_lessons',
        },
      });
      lessonResult === 'inserted' ? inserted++ : skipped++;
    }
  }

  const { count, error: countError } = await supabase
    .from('course_embeddings')
    .select('id', { count: 'exact', head: true });
  if (countError) throw countError;

  console.log(
    JSON.stringify(
      {
        courses_scanned: courses?.length ?? 0,
        embeddings_inserted: inserted,
        sources_skipped_existing_or_empty: skipped,
        total_embeddings: count ?? 0,
        model: MODEL,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
