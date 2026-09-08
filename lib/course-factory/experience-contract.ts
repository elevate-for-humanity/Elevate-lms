import { z } from 'zod';

export const ExperienceOptionSchema = z.object({
  text: z.string().trim().min(1),
  isCorrect: z.boolean(),
  feedback: z.string().trim().min(1),
});

export const ExperienceKnowledgeCheckSchema = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correct: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1),
});

const TimestampSchema = z.number().min(0);
const TimelineCaptionSchema = z
  .object({
    start: z.number().min(0),
    end: z.number().min(0),
    text: z.string().trim().min(1),
  })
  .refine((segment) => segment.end >= segment.start, {
    message: 'Caption end must be after its start.',
  });

export const TimelineSceneSchema = z
  .object({
    id: z.string().trim().min(1),
    startTime: TimestampSchema,
    endTime: TimestampSchema,
    purpose: z.enum([
      'introduction',
      'explanation',
      'diagram',
      'demonstration',
      'practice',
      'summary',
    ]),
    visualType: z.enum([
      'generated-video',
      'equipment-image',
      'technical-diagram',
      'animated-text',
      'screen-demonstration',
      'instructor',
    ]),
    narration: z.string().trim().min(1),
    visualDirection: z.string().trim().min(1),
    onScreenText: z.array(z.string().trim().min(1)).default([]),
    sourceReferences: z.array(z.string().trim().min(1)).default([]),
  })
  .refine((scene) => scene.endTime > scene.startTime, {
    message: 'Scene endTime must be after startTime.',
  });

export const TimelineEventSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('pause'),
    id: z.string().min(1),
    at: TimestampSchema,
    required: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('question'),
    id: z.string().min(1),
    at: TimestampSchema,
    questionId: z.string().min(1),
    required: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('diagram'),
    id: z.string().min(1),
    at: TimestampSchema,
    assetId: z.string().min(1),
    required: z.boolean().default(false),
  }),
  z.object({
    type: z.literal('remediation'),
    id: z.string().min(1),
    at: TimestampSchema,
    objective: z.string().min(1),
    required: z.boolean().default(true),
  }),
]);

export const InstructionalTimelineSchema = z
  .object({
    version: z.number().int().positive().default(1),
    width: z.number().int().positive().default(1920),
    height: z.number().int().positive().default(1080),
    fps: z.number().int().min(12).max(120).default(30),
    durationSeconds: z.number().positive(),
    scenes: z.array(TimelineSceneSchema).min(2),
    captions: z.array(TimelineCaptionSchema).min(1),
    events: z.array(TimelineEventSchema).min(1),
    requiredWatchPercent: z.number().int().min(1).max(100).default(95),
    minimumSeatTimeSeconds: z.number().int().min(0),
    preventSeekPastRequiredEvents: z.boolean().default(true),
    resumeEnabled: z.boolean().default(true),
  })
  .superRefine((timeline, ctx) => {
    const ordered = [...timeline.scenes].sort((a, b) => a.startTime - b.startTime);
    ordered.forEach((scene, index) => {
      if (scene.endTime > timeline.durationSeconds)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Scene ${scene.id} exceeds timeline duration.`,
          path: ['scenes', index],
        });
      if (index > 0 && scene.startTime < ordered[index - 1].endTime)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Scene ${scene.id} overlaps the previous scene.`,
          path: ['scenes', index],
        });
    });
    timeline.events.forEach((event, index) => {
      if (event.at > timeline.durationSeconds)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Event ${event.id} exceeds timeline duration.`,
          path: ['events', index],
        });
    });
  });

const InteractiveVideoCheckpointSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('quiz'),
    timestamp: TimestampSchema,
    question: z.string().trim().min(1),
    options: z.array(z.string().trim().min(1)).min(2),
    answer: z.number().int().min(0),
    explanation: z.string().trim().min(1).optional(),
  }),
  z.object({
    type: z.literal('hotspot'),
    timestamp: TimestampSchema,
    prompt: z.string().trim().min(1),
    areas: z
      .array(
        z.object({
          label: z.string().trim().min(1),
          correct: z.boolean(),
          info: z.string().trim().min(1),
        }),
      )
      .min(2)
      .refine((areas) => areas.some((area) => area.correct), {
        message: 'At least one hotspot area must be correct.',
      }),
  }),
  z.object({
    type: z.literal('scenario'),
    timestamp: TimestampSchema,
    situation: z.string().trim().min(1),
    choices: z
      .array(
        z.object({
          text: z.string().trim().min(1),
          feedback: z.string().trim().min(1),
          correct: z.boolean(),
        }),
      )
      .min(2)
      .refine((choices) => choices.some((choice) => choice.correct), {
        message: 'At least one scenario choice must be correct.',
      }),
  }),
  z.object({
    type: z.literal('reflection'),
    timestamp: TimestampSchema,
    prompt: z.string().trim().min(1),
    minChars: z.number().int().min(1).max(5000).optional(),
  }),
  z.object({
    type: z.literal('key-concept'),
    timestamp: TimestampSchema,
    concept: z.string().trim().min(1),
    bullets: z.array(z.string().trim().min(1)).optional(),
  }),
]);

const TimedTranscriptSegmentSchema = z
  .object({
    start: z.number().min(0),
    end: z.number().min(0),
    text: z.string().trim().min(1),
  })
  .refine((segment) => segment.end >= segment.start, {
    message: 'Transcript segment end must be after its start.',
  });

export const InteractiveVideoExperienceSchema = z.object({
  checkpoints: z.array(InteractiveVideoCheckpointSchema).min(1),
  transcript: z.array(TimedTranscriptSegmentSchema).min(1),
  requiredWatchPercent: z.number().int().min(1).max(100).default(95),
  minimumSeatTimeSeconds: z.number().int().min(0).optional(),
});

export const CourseExperienceSchema = z
  .object({
    // Long-form reading layer (commercial eBook-equivalent experience).
    readingGuide: z.object({
      title: z.string().trim().min(1),
      summary: z.string().trim().min(80),
      sections: z
        .array(
          z.object({
            heading: z.string().trim().min(1),
            body: z.string().trim().min(120),
          }),
        )
        .min(3),
      keyTakeaways: z.array(z.string().trim().min(1)).min(3),
    }),
    content: z.string().min(500).max(50000).optional(),
    narrationScript: z.string().trim().min(200).max(20000),
    visualPrompt: z.string().trim().min(40).max(4000),

    // Quick review layer (flashcard / QuickDeck-equivalent category).
    flashcards: z
      .array(
        z.object({
          id: z.string().optional(),
          front: z.string().trim().min(1),
          back: z.string().trim().min(1),
          tags: z.array(z.string()).default([]),
        }),
      )
      .min(6),

    // Short concept-clip layer. These are scripts/specs that the media worker renders.
    quickClips: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          title: z.string().trim().min(1),
          objective: z.string().trim().min(1),
          durationSeconds: z.number().int().min(60).max(300),
          script: z.string().trim().min(120),
          visualPrompt: z.string().trim().min(40),
        }),
      )
      .min(2),

    knowledgeChecks: z.array(ExperienceKnowledgeCheckSchema).min(3),
    scenario: z.object({
      title: z.string().trim().min(1),
      context: z.string().trim().min(1),
      question: z.string().trim().min(1),
      options: z.array(ExperienceOptionSchema).min(2),
    }),
    caseStudy: z.object({
      title: z.string().trim().min(1),
      context: z.string().trim().min(1),
      question: z.string().trim().min(1),
      options: z.array(ExperienceOptionSchema).min(2),
    }),

    // Learn-by-doing is required throughout, not only in dedicated lab lessons.
    exercises: z
      .array(
        z.object({
          id: z.string().trim().min(1),
          title: z.string().trim().min(1),
          instructions: z.array(z.string().trim().min(1)).min(2),
          expectedArtifact: z.string().trim().min(1),
          autoGrade: z.object({
            type: z.enum(['checklist', 'multiple_choice', 'numeric', 'text_rubric']),
            criteria: z.array(z.string().trim().min(1)).min(1),
          }),
        }),
      )
      .min(1),

    practicalTask: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      instructions: z.array(z.string().trim().min(1)).min(3),
      evidence: z.string().trim().min(1),
    }),

    // Downloadable/support resources generated per lesson.
    resources: z
      .array(
        z.object({
          type: z.enum([
            'worksheet',
            'template',
            'checklist',
            'reference',
            'calculator',
            'example',
          ]),
          title: z.string().trim().min(1),
          description: z.string().trim().min(1),
          content: z.string().trim().min(40),
        }),
      )
      .min(2),

    glossary: z
      .array(
        z.object({
          term: z.string().trim().min(1),
          definition: z.string().trim().min(1),
        }),
      )
      .min(4),

    remediation: z.object({
      passingScore: z.number().int().min(1).max(100),
      reviewMessage: z.string().trim().min(1),
      objectiveMap: z.array(z.string().trim().min(1)).min(3),
      targetedActions: z
        .array(
          z.object({
            objective: z.string().trim().min(1),
            action: z.string().trim().min(1),
          }),
        )
        .min(1),
    }),

    // Readiness data gives the learner and reporting layer domain-level evidence.
    readiness: z.object({
      domainKey: z.string().trim().min(1),
      masteryThreshold: z.number().int().min(1).max(100),
      evidenceSignals: z.array(z.string().trim().min(1)).min(3),
    }),

    hotspots: z.array(z.unknown()).optional(),
    dragDrop: z.unknown().optional(),
    matching: z.unknown().optional(),
    simulation: z.unknown().optional(),
    decisionTree: z.unknown().optional(),
    interactiveVideo: InteractiveVideoExperienceSchema.optional(),
    instructionalTimeline: InstructionalTimelineSchema.optional(),
  })
  .passthrough();

export type CourseExperience = z.infer<typeof CourseExperienceSchema>;
export type InstructionalTimeline = z.infer<typeof InstructionalTimelineSchema>;

export const publicationRequirements = [
  'credential_alignment',
  'learning_objectives',
  'instructional_content',
  'demonstration',
  'interactive_practice',
  'knowledge_checks',
  'module_assessments',
  'practice_exam',
  'narration',
  'captions',
  'transcript',
  'accessibility',
  'learner_preview',
  'progress_tracking',
  'resume_tracking',
] as const;

export type PublicationRequirement = (typeof publicationRequirements)[number];

/** Canonical learner-facing contract assembled from persisted lesson fields and CourseExperience. */
export type InteractiveLesson = {
  title: string;
  objectives: string[];
  narration: string;
  transcript: string;
  demonstration: { visualPrompt: string; quickClips: CourseExperience['quickClips'] };
  knowledgeChecks: CourseExperience['knowledgeChecks'];
  guidedPractice: CourseExperience['exercises'];
  handsOnAssignment?: CourseExperience['practicalTask'];
  glossaryTerms: CourseExperience['glossary'];
  references: CourseExperience['resources'];
  completionRule: {
    minimumScore: number;
    requiredInteractions: string[];
    requireMediaCompletion: boolean;
  };
  accessibility: {
    captionsRequired: true;
    transcriptRequired: true;
    keyboardReady: true;
    altTextRequired: true;
  };
};

export type CompleteModule = {
  objectives: string[];
  lessons: InteractiveLesson[];
  moduleAssessment: { questionCount: number; passingScore: number };
  remediationRules: Array<{ objective: string; action: string }>;
};
export type CompleteCourse = {
  credential: { governingBody: string; standardVersion: string; domains: string[] };
  modules: CompleteModule[];
  questionBank: Array<{ question: string; domainKey: string; explanation: string }>;
  practiceExams: Array<{ title: string; questionCount: number; passingScore: number }>;
  resources: CourseExperience['resources'];
  accessibility: {
    captions: boolean;
    transcripts: boolean;
    keyboardReady: boolean;
    altText: boolean;
  };
  learnerPreview: { renderable: boolean; checkedAt: string };
  publicationReadiness: Record<PublicationRequirement, boolean>;
};
