import type { ProgramSchema } from '@/lib/programs/program-schema';
import { getSocCode } from '@/lib/onet/soc-map';
import type {
  BlueprintAssessmentRule,
  BlueprintCompetency,
  BlueprintLessonRef,
  BlueprintLessonTypeRule,
  BlueprintModule,
  BlueprintVideoConfig,
  CredentialBlueprint,
} from './types';

const SECTOR_VIDEO_CONFIG: Record<ProgramSchema['sector'], Partial<BlueprintVideoConfig>> = {
  'skilled-trades': {
    topBarColor: '#f97316',
    accentColor: '#fb7185',
    instructorTitle: 'Lead Trades Instructor',
    instructorImagePath: '/images/instructors/marcus-johnson.jpg',
  },
  healthcare: {
    topBarColor: '#0ea5e9',
    accentColor: '#22c55e',
    instructorTitle: 'Clinical Program Lead',
    instructorImagePath: '/images/instructors/marcus-johnson.jpg',
  },
  'personal-services': {
    topBarColor: '#ec4899',
    accentColor: '#f97316',
    instructorTitle: 'Program Instructor',
    instructorImagePath: '/images/instructors/marcus-johnson.jpg',
  },
  technology: {
    topBarColor: '#8b5cf6',
    accentColor: '#38bdf8',
    instructorTitle: 'Technology Lead Instructor',
    instructorImagePath: '/images/instructors/marcus-johnson.jpg',
  },
  business: {
    topBarColor: '#2563eb',
    accentColor: '#14b8a6',
    instructorTitle: 'Business Program Instructor',
    instructorImagePath: '/images/instructors/marcus-johnson.jpg',
  },
};

const DEFAULT_VIDEO_CONFIG: BlueprintVideoConfig = {
  videoGenerator: 'runway',
  template: 'elevate-slide',
  instructorName: 'Marcus Johnson',
  instructorTitle: 'Lead Instructor',
  instructorImagePath: '/images/instructors/marcus-johnson.jpg',
  topBarColor: '#f97316',
  accentColor: '#3b82f6',
  backgroundColor: '#0f172a',
  ttsVoice: 'onyx',
  ttsSpeed: 0.95,
  slideCount: 5,
  segments: ['intro', 'concept', 'visual', 'application', 'wrapup'],
  generateDalleImage: true,
  dalleImageStyle: 'natural',
  width: 1920,
  height: 1080,
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getLessonTopics(program: ProgramSchema): string[] {
  return program.curriculum.flatMap((section) => section.topics).filter(Boolean);
}

function buildCompetency(moduleSlug: string, milestone: string, finalModule: boolean): BlueprintCompetency {
  return {
    competencyKey: `${moduleSlug}-competency`,
    isCritical: finalModule,
    minimumTouchpoints: 1,
    assessmentMethod: finalModule ? 'quiz' : 'observation',
    requiresInstructorSignoff: false,
    domainKey: moduleSlug,
  };
}

function buildLessonTypes(finalModule: boolean, practical: boolean): BlueprintLessonTypeRule[] {
  const rules: BlueprintLessonTypeRule[] = [
    { lessonType: 'lesson', requiredCount: 3 },
    { lessonType: practical ? 'lab' : 'lesson', requiredCount: 1 },
    { lessonType: 'checkpoint', requiredCount: 1 },
  ];

  if (finalModule) {
    return rules;
  }

  return rules;
}

function buildModuleLessons(
  program: ProgramSchema,
  moduleSlug: string,
  moduleTitle: string,
  moduleIndex: number,
  milestone: string,
  finalModule: boolean,
  practical: boolean,
): BlueprintLessonRef[] {
  const topicSeed = getLessonTopics(program);
  const topic = topicSeed[moduleIndex % (topicSeed.length || 1)] ?? milestone;
  const checkpointSuffix = finalModule ? 'checkpoint' : 'checkpoint';
  const lessonPrefix = `${slugify(program.slug)}-${moduleSlug}`;

  return [
    {
      slug: `${lessonPrefix}-overview`,
      title: `Overview of ${moduleTitle}`,
      order: 1,
      domainKey: moduleSlug,
      competencyKeys: [`${moduleSlug}-competency`],
    },
    {
      slug: `${lessonPrefix}-core-concepts`,
      title: `Core Concepts in ${moduleTitle}`,
      order: 2,
      domainKey: moduleSlug,
      competencyKeys: [`${moduleSlug}-competency`],
    },
    {
      slug: `${lessonPrefix}-guided-practice`,
      title: `Guided Practice: ${topic}`,
      order: 3,
      domainKey: moduleSlug,
      competencyKeys: [`${moduleSlug}-competency`],
    },
    {
      slug: practical ? `${lessonPrefix}-lab` : `${lessonPrefix}-applied-skills`,
      title: practical ? `Hands-On Lab: ${milestone}` : `Applied Skills: ${milestone}`,
      order: 4,
      domainKey: moduleSlug,
      competencyKeys: [`${moduleSlug}-competency`],
      competencyChecks: practical
        ? [
            `Demonstrate safe, correct completion of the ${moduleTitle.toLowerCase()} task`,
            `Explain the steps and tools used in this module`,
          ]
        : undefined,
    },
    {
      slug: `${lessonPrefix}-${checkpointSuffix}`,
      title: finalModule ? `Final Review Checkpoint: ${moduleTitle}` : `Module Checkpoint: ${moduleTitle}`,
      order: 5,
      domainKey: moduleSlug,
      competencyKeys: [`${moduleSlug}-competency`],
    },
  ];
}

function buildModule(
  program: ProgramSchema,
  moduleIndex: number,
  moduleTitle: string,
  milestone: string,
): BlueprintModule {
  const moduleSlug = `${slugify(program.slug)}-module-${moduleIndex + 1}`;
  const finalModule = moduleIndex === program.weeklySchedule.length - 1;
  const practical = ['healthcare', 'personal-services', 'skilled-trades'].includes(program.sector);
  const lessons = buildModuleLessons(program, moduleSlug, moduleTitle, moduleIndex, milestone, finalModule, practical);

  return {
    slug: moduleSlug,
    title: moduleTitle,
    orderIndex: moduleIndex + 1,
    minLessons: lessons.length,
    maxLessons: lessons.length,
    quizRequired: true,
    practicalRequired: practical,
    isCritical: finalModule || moduleIndex === 0,
    requiredLessonTypes: buildLessonTypes(finalModule, practical),
    competencies: [buildCompetency(moduleSlug, milestone, finalModule)],
    suggestedLessonSkeleton: lessons.map((lesson) => lesson.title),
    lessons,
    domainKey: moduleSlug,
  };
}

function buildAssessmentRules(moduleCount: number): BlueprintAssessmentRule[] {
  return [
    {
      assessmentType: 'module',
      scope: 'all',
      minQuestions: 5,
      maxQuestions: 10,
      passingThreshold: 0.7,
    },
    {
      assessmentType: 'final',
      scope: 'all',
      minQuestions: 20,
      maxQuestions: Math.max(25, moduleCount * 4),
      passingThreshold: 0.75,
    },
  ];
}

function buildVideoConfig(program: ProgramSchema): BlueprintVideoConfig {
  const sectorConfig = SECTOR_VIDEO_CONFIG[program.sector] ?? {};
  return {
    ...DEFAULT_VIDEO_CONFIG,
    ...sectorConfig,
    instructorName: `${program.title} Instructor`,
    backgroundColor: '#0f172a',
  };
}

export function buildProgramBlueprint(program: ProgramSchema): CredentialBlueprint {
  const moduleCount = program.weeklySchedule.length || program.curriculum.length || 6;
  const weeklyEntries = program.weeklySchedule.length
    ? program.weeklySchedule
    : Array.from({ length: moduleCount }, (_, index) => ({
        week: `Week ${index + 1}`,
        title: program.curriculum[index % (program.curriculum.length || 1)]?.title ?? `${program.title} Module ${index + 1}`,
        competencyMilestone:
          program.curriculum[index % (program.curriculum.length || 1)]?.topics[0] ??
          `${program.title} competency ${index + 1}`,
      }));

  const modules = weeklyEntries.map((entry, index) =>
    buildModule(program, index, entry.title || `Module ${index + 1}`, entry.competencyMilestone),
  );

  const credentialCode = slugify(program.title)
    .split('-')
    .map((part) => part.slice(0, 3).toUpperCase())
    .join('-')
    .slice(0, 18);

  const socCode = getSocCode(program.slug) ?? undefined;

  return {
    id: `${program.slug}-v1`,
    version: '1.0.0',
    credentialSlug: program.slug,
    credentialTitle: program.title,
    credentialCode,
    socCode,
    state: 'IN',
    programSlug: program.slug,
    trackVariants: ['standard'],
    status: 'active',
    credentialTarget: 'INTERNAL',
    generationRules: {
      allowRemediation: true,
      allowExpansionLessons: false,
      maxTotalLessons: modules.length * 5,
      requiresFinalExam: false,
      requiresUniversalReview: false,
      generatorMode: 'flexible',
    },
    expectedModuleCount: modules.length,
    expectedLessonCount: modules.reduce((total, mod) => total + (mod.lessons?.length ?? 0), 0),
    modules,
    assessmentRules: buildAssessmentRules(modules.length),
    videoConfig: buildVideoConfig(program),
  };
}

export function buildProgramBlueprints(programs: ProgramSchema[]): CredentialBlueprint[] {
  return programs.map(buildProgramBlueprint);
}
