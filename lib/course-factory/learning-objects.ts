export const LEARNING_OBJECT_TYPES = [
  'introduction',
  'objectives',
  'pre-assessment',
  'reading',
  'instructional-video',
  'knowledge-check',
  'guided-instruction',
  'scenario',
  'applied-check',
  'practical',
  'reflection',
  'summary',
  'chapter-quiz',
  'remediation',
] as const;

export type LearningObjectType = (typeof LEARNING_OBJECT_TYPES)[number];
export type LearningObject = {
  id: string;
  type: LearningObjectType;
  title: string;
  order: number;
  required: boolean;
  completion: 'view' | 'media' | 'score' | 'submission' | 'conditional';
  source: string;
};

type LessonSource = {
  slug: string;
  videoUrl?: string | null;
  quizQuestions?: unknown[] | null;
  experience?: Record<string, any> | null;
};

export function buildLessonLearningObjects(source: LessonSource): LearningObject[] {
  const experience = source.experience ?? {};
  const hasPractical = Boolean(experience.practicalTask);
  const hasScenario = Boolean(experience.scenario || experience.caseStudy);
  const hasVideo = Boolean(
    source.videoUrl || experience.instructionalTimeline || experience.narrationScript,
  );
  const hasQuiz = Boolean(source.quizQuestions?.length || experience.knowledgeChecks?.length);
  const definitions: Array<Omit<LearningObject, 'id' | 'order'>> = [
    {
      type: 'introduction',
      title: 'Introduction',
      required: true,
      completion: 'view',
      source: 'readingGuide.summary',
    },
    {
      type: 'objectives',
      title: 'Learning objectives',
      required: true,
      completion: 'view',
      source: 'learning_objectives',
    },
    {
      type: 'pre-assessment',
      title: 'Check what you know',
      required: false,
      completion: 'score',
      source: 'preAssessment',
    },
    {
      type: 'reading',
      title: 'Read and learn',
      required: true,
      completion: 'view',
      source: 'readingGuide.sections',
    },
    {
      type: 'instructional-video',
      title: 'Watch the demonstration',
      required: hasVideo,
      completion: 'media',
      source: 'video_url',
    },
    {
      type: 'knowledge-check',
      title: 'Knowledge check',
      required: hasQuiz,
      completion: 'score',
      source: 'knowledgeChecks',
    },
    {
      type: 'guided-instruction',
      title: 'Guided instruction',
      required: true,
      completion: 'view',
      source: 'exercises',
    },
    {
      type: 'scenario',
      title: 'Workplace scenario',
      required: hasScenario,
      completion: 'score',
      source: 'scenario',
    },
    {
      type: 'applied-check',
      title: 'Apply what you learned',
      required: hasQuiz,
      completion: 'score',
      source: 'caseStudy',
    },
    {
      type: 'practical',
      title: 'Hands-on practice',
      required: hasPractical,
      completion: 'submission',
      source: 'practicalTask',
    },
    {
      type: 'reflection',
      title: 'Reflect and discuss',
      required: false,
      completion: 'submission',
      source: 'reflection',
    },
    {
      type: 'summary',
      title: 'Lesson summary',
      required: true,
      completion: 'view',
      source: 'readingGuide.keyTakeaways',
    },
    {
      type: 'chapter-quiz',
      title: 'Lesson quiz',
      required: false,
      completion: 'score',
      source: 'quiz_questions',
    },
    {
      type: 'remediation',
      title: 'Targeted review',
      required: false,
      completion: 'conditional',
      source: 'remediation',
    },
  ];
  const tracked: Partial<Record<LearningObjectType, string>> = {
    'instructional-video': `${source.slug}-interactive-video`,
    'knowledge-check': `${source.slug}-kc`,
    scenario: `${source.slug}-scenario`,
    'applied-check': `${source.slug}-case`,
    practical: `${source.slug}-practical`,
  };
  return definitions.map((definition, index) => ({
    ...definition,
    id: tracked[definition.type] ?? `${source.slug}:object:${definition.type}`,
    order: index + 1,
  }));
}

export function requiredLearningObjectIds(objects: LearningObject[]): string[] {
  return objects.filter((object) => object.required).map((object) => object.id);
}
