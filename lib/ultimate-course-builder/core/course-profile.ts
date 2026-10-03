import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateAppendixAStandardsSource } from '../credential/appendix-a-source';

type CompetencyRow = {
  competency_key?: string | null;
  category?: string | null;
  source_label?: string | null;
  description?: string | null;
};

function competencyType(row: CompetencyRow, regulated: boolean) {
  if (!regulated) return 'knowledge' as const;
  const value = `${row.category ?? ''} ${row.source_label ?? ''}`;
  if (/trim|clean|covering|cut|shav|sanit|disinfect|chemical|color/i.test(value)) {
    return 'practical_skill' as const;
  }
  if (/discuss|recommend|consult|select|decide/i.test(value)) return 'decision' as const;
  return 'knowledge' as const;
}

export async function buildUltimateProfile(
  db: SupabaseClient,
  input: {
    courseId: string;
    programSlug: string;
    title: string;
    topic?: string;
    audience?: string;
    state?: string;
  },
) {
  const registeredSource = new UltimateAppendixAStandardsSource();
  if (registeredSource.supports({ programSlug: input.programSlug })) {
    const profile = await registeredSource.load({ programSlug: input.programSlug });
    return {
      ...profile,
      title: input.title,
      audience: input.audience?.trim() || undefined,
    };
  }

  const { data: standard, error: standardError } = await db
    .from('apprenticeship_standard_versions')
    .select('*')
    .eq('program_slug', input.programSlug)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (standardError) throw standardError;

  let competencyRows: CompetencyRow[] = [];
  if (standard) {
    const competencyResult = await db
      .from('apprenticeship_standard_competencies')
      .select('competency_key,category,source_label,description')
      .eq('standard_key', standard.standard_key)
      .eq('is_required', true)
      .order('display_order');
    if (competencyResult.error) throw competencyResult.error;
    competencyRows = competencyResult.data ?? [];
  }

  if (!competencyRows.length) {
    const { data: lessons, error: lessonError } = await db
      .from('course_lessons')
      .select('id,title,learning_objectives')
      .eq('course_id', input.courseId)
      .order('order_index');
    if (lessonError) throw lessonError;
    competencyRows = (lessons ?? []).map((lesson, index) => ({
      competency_key: lesson.id,
      category: lesson.title || `Lesson ${index + 1}`,
      source_label: lesson.title || `Lesson ${index + 1}`,
      description:
        Array.isArray(lesson.learning_objectives) && lesson.learning_objectives.length
          ? lesson.learning_objectives.join('; ')
          : `Teach and verify ${lesson.title || `lesson ${index + 1}`}.`,
    }));
  }

  if (!competencyRows.length) {
    competencyRows = [
      {
        competency_key: `course-${input.courseId}`,
        category: input.title,
        source_label: input.title,
        description:
          input.topic?.trim() ||
          `Build complete learner-ready instruction, practice, assessment, media, accessibility, QA, and release evidence for ${input.title}.`,
      },
    ];
  }

  // Hydrate the Ultimate instructional source package from curriculum already
  // owned by this course. This gives fresh builds source-grounded material
  // instead of forcing learning_objectives to retry with an empty source list.
  const { data: sourceLessons, error: sourceLessonError } = await db
    .from('course_lessons')
    .select('id,title,learning_objectives,content')
    .eq('course_id', input.courseId)
    .order('order_index');
  if (sourceLessonError) throw sourceLessonError;
  const instructionalSources = (sourceLessons ?? [])
    .map((lesson: any) => {
      const objectives = Array.isArray(lesson.learning_objectives)
        ? lesson.learning_objectives.filter(Boolean).join('; ')
        : '';
      const content =
        typeof lesson.content === 'string'
          ? lesson.content
          : lesson.content
            ? JSON.stringify(lesson.content)
            : '';
      const text = [
        lesson.title ? `Lesson: ${lesson.title}` : '',
        objectives ? `Learning objectives: ${objectives}` : '',
        content ? `Authorized course content: ${content}` : '',
      ]
        .filter(Boolean)
        .join('\n');
      return text.trim() ? { id: `course-lesson:${lesson.id}`, text } : null;
    })
    .filter(Boolean);

  return {
    id: standard?.standard_key ?? `course:${input.courseId}`,
    title: input.title,
    authority: standard?.source_authority ?? 'course-defined',
    jurisdiction: input.state?.trim() || standard?.state || 'IN',
    standardVersion: String(
      standard?.revision_date || standard?.registration_date || 'course-defined',
    ),
    effectiveDate: standard?.revision_date || standard?.registration_date || undefined,
    sourceDocuments: standard
      ? ['DOL Appendix A Work Process Schedule', 'Related Instruction Outline']
      : instructionalSources.map((source: any) => source.id),
    instructionalSources,
    socCodes: standard?.onet_soc_code ? [standard.onet_soc_code] : [],
    trainingRequirements: {
      instructionalHours: standard?.related_instruction_hours || undefined,
    },
    audience: input.audience?.trim() || undefined,
    competencies: competencyRows.map((row, index) => ({
      id: row.competency_key || `competency-${index + 1}`,
      title: row.category || row.source_label || `Competency ${index + 1}`,
      description: row.description || row.source_label || `Demonstrate competency ${index + 1}`,
      type: competencyType(row, Boolean(standard)),
      authorityRequirementIds: standard && row.competency_key ? [row.competency_key] : [],
      requiresDemonstration: Boolean(standard),
      requiresPracticalEvidence: Boolean(standard),
      criticalSafetyCompetency: standard
        ? /clean|sanit|disinfect|protective|safety/i.test(
            `${row.category ?? ''} ${row.description ?? ''}`,
          )
        : false,
    })),
  };
}

