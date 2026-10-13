import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateAppendixAStandardsSource } from '../credential/appendix-a-source';
import { registeredInstructionalSources } from '../credential/registered-instructional-sources';
import { getRegisteredProgramStandardByProfileId } from '@/lib/apprenticeship/registered-program-contract';
import type { UltimateCredentialProfile } from './types';
import { classifyCompetency } from '../instructional/competency-classification.mjs';
import { approvedPresentationForCourse } from '../instructional/approved-presentation.mjs';

type CompetencyRow = {
  competency_key?: string | null;
  category?: string | null;
  source_label?: string | null;
  description?: string | null;
};

function competencyType(row: CompetencyRow, regulated: boolean) {
  if (!regulated) return classifyCompetency(row.category || row.source_label).type;
  const value = `${row.category ?? ''} ${row.source_label ?? ''}`;
  if (/trim|clean|covering|cut|shav|sanit|disinfect|chemical|color/i.test(value)) {
    return 'practical_skill' as const;
  }
  if (/discuss|recommend|consult|select|decide/i.test(value)) return 'decision' as const;
  return 'knowledge' as const;
}

export async function hydrateUltimateProfileSources(
  db: SupabaseClient,
  courseId: string,
  profile: UltimateCredentialProfile,
): Promise<UltimateCredentialProfile> {
  const presentation = approvedPresentationForCourse(courseId);
  if (presentation === 'approved-premium-v1') {
    const assetId = '9ae74de2-2fd2-45df-9c54-59c9e3c5c07c';
    const storagePath = '2c723bfa-8c40-4acc-b961-98d917710ffc/1791848294710-Barber_LMS_Sample.mp4';
    const { data: reference, error: referenceError } = await db.from('course_videos')
      .select('id,status,asset_role,storage_path').eq('id', assetId).single();
    if (referenceError || reference?.status !== 'ready' || reference?.asset_role !== 'reference' ||
        reference?.storage_path !== storagePath) throw new Error('APPROVED_REFERENCE_VIDEO_REQUIRED');
    const { data: video, error: downloadError } = await db.storage.from('course_videos').download(storagePath);
    if (downloadError || !video || video.size === 0) throw new Error('APPROVED_REFERENCE_VIDEO_UNREADABLE');
    const sha256 = createHash('sha256').update(Buffer.from(await video.arrayBuffer())).digest('hex');
    const previous = (profile as any).presentationContract?.approvedReferenceVideo;
    if (previous?.assetId === assetId && previous.sha256 && previous.sha256 !== sha256)
      throw new Error('APPROVED_REFERENCE_VIDEO_CHANGED');
    profile = { ...profile, lessonPresentation: presentation, presentationContract: {
      version: 'owner-approved-video-2026-10-12.2',
      approvedReferenceVideo: { assetId, storagePath, sha256, approvedAt: '2026-10-12', permittedUses: ['presentation-reference'] },
      visualStyle: { cropMode: 'contain', transition: 'crossfade' },
      instructions: [
        'Use the owner-approved reference as the presentation standard, never as reusable lesson footage.',
        'Show whole large photos with concise explanations; preserve hands, tools, and heads without cropping.',
        'Use restrained transitions and unique task-relevant visuals; no generic filler or repeated photo loops.',
        'Narration is the timing master: synchronize visuals, teaching text and persistent captions.',
        'No duplicate or overlapping narration, silent blank delays, or audible source-clip speech.',
        'Teach prerequisites and tools, preparation, step-by-step demonstration, finished-result inspection and sanitation.',
        'Include feedback and retry assessment plus mentor practical checkoff where the standard requires it.',
        'Never release until delivered-media, instructional, narration and learner QA pass.',
      ],
    } };
  }
  const registeredContract = getRegisteredProgramStandardByProfileId(profile.id);
  // Teaching modality does not waive the registered mentor performance requirement.
  if (registeredContract) {
    const authority = new Map(registeredContract.standard.competencies.map(c => [c.id, c]));
    profile = {...profile, competencies: profile.competencies.map(c => {
      const standard = authority.get(c.id);
      return standard ? {...c, type: competencyType({category:standard.category}, true)} : c;
    })};
  }
  const registeredSources = registeredContract
    ? registeredInstructionalSources(registeredContract.canonicalProgramSlug)
    : [];
  const { data: lessons, error } = await db
    .from('course_lessons')
    .select('id,slug,title,learning_objectives,content,content_json')
    .eq('course_id', courseId)
    .order('order_index');
  if (error) throw error;

  const competencyIds = new Set(profile.competencies.map((competency) => competency.id));
  const canonicalSources = (lessons ?? [])
    .flatMap((lesson: any) => {
      // Preserve the exact competency identifier used by the instructional
      // generator. A canonical UUID, slug, and content_json key may differ.
      const keys = [lesson.id, lesson.slug, lesson.content_json?.competencyId]
        .filter((key): key is string => typeof key === 'string' && competencyIds.has(key));
      if (!keys.length) return [];
      const objectives = Array.isArray(lesson.learning_objectives)
        ? lesson.learning_objectives.filter(Boolean).join('; ') : '';
      // The source reader consumes a JSON envelope. Plain authored text must
      // enter that same schema instead of becoming invalid transport on resume.
      // Historical repair evidence remains stored, but must not become a
      // competing teaching source after the current lesson has been corrected.
      const currentContent = lesson.content && typeof lesson.content === 'object'
        ? Object.fromEntries(Object.entries(lesson.content).filter(([key]) =>
          !['production_content_repairs', 'previous_sanitation_html'].includes(key)))
        : lesson.content;
      const content = typeof currentContent === 'string'
        ? (currentContent.trim() ? JSON.stringify({html:currentContent}) : '')
        : currentContent ? JSON.stringify(currentContent) : '';
      // Titles and objectives alone are not an authorized teaching source.
      if (!content.trim()) return [];
      const text = [lesson.title ? `Lesson: ${lesson.title}` : '',
        objectives ? `Learning objectives: ${objectives}` : '',
        `Authorized course content: ${content}`].filter(Boolean).join('\\n');
      return [...new Set(keys)].map(key => ({ id: `course-lesson:${key}`, text }));
    });
  if (!canonicalSources.length && !registeredSources.length) return profile;
  const sources = new Map(registeredSources.map((source) => [source.id, source]));
  for (const source of profile.instructionalSources ?? []) sources.set(source.id, source);
  for (const source of canonicalSources) sources.set(source.id, source);
  return {
    ...profile,
    sourceDocuments: profile.sourceDocuments.length
      ? profile.sourceDocuments
      : [...registeredSources, ...canonicalSources].map((source) => source.id),
    instructionalSources: [...sources.values()],
  };
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
    return hydrateUltimateProfileSources(db, input.courseId, {
      ...profile,
      title: input.title,
      audience: input.audience?.trim() || undefined,
    });
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

  return hydrateUltimateProfileSources(db, input.courseId, {
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
      : [],
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
      requiresDemonstration: Boolean(standard) || classifyCompetency(row.category || row.source_label).requiresDemonstration,
      requiresPracticalEvidence: Boolean(standard) || classifyCompetency(row.category || row.source_label).requiresPracticalEvidence,
      criticalSafetyCompetency: classifyCompetency(row.category || row.source_label).criticalSafetyCompetency ||
        Boolean(standard && /clean|sanit|disinfect|protective|safety/i.test(`${row.category ?? ''} ${row.description ?? ''}`)),
    })),
  });
}
