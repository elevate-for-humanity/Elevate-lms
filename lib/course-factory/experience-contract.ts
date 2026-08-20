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

export const CourseExperienceSchema = z
  .object({
    // Long-form reading layer (commercial eBook-equivalent experience).
    readingGuide: z.object({
      title: z.string().trim().min(1),
      summary: z.string().trim().min(80),
      sections: z.array(z.object({
        heading: z.string().trim().min(1),
        body: z.string().trim().min(120),
      })).min(3),
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
    quickClips: z.array(z.object({
      id: z.string().trim().min(1),
      title: z.string().trim().min(1),
      objective: z.string().trim().min(1),
      durationSeconds: z.number().int().min(60).max(300),
      script: z.string().trim().min(120),
      visualPrompt: z.string().trim().min(40),
    })).min(2),

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
    exercises: z.array(z.object({
      id: z.string().trim().min(1),
      title: z.string().trim().min(1),
      instructions: z.array(z.string().trim().min(1)).min(2),
      expectedArtifact: z.string().trim().min(1),
      autoGrade: z.object({
        type: z.enum(['checklist', 'multiple_choice', 'numeric', 'text_rubric']),
        criteria: z.array(z.string().trim().min(1)).min(1),
      }),
    })).min(1),

    practicalTask: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      instructions: z.array(z.string().trim().min(1)).min(3),
      evidence: z.string().trim().min(1),
    }),

    // Downloadable/support resources generated per lesson.
    resources: z.array(z.object({
      type: z.enum(['worksheet', 'template', 'checklist', 'reference', 'calculator', 'example']),
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      content: z.string().trim().min(40),
    })).min(2),

    glossary: z.array(z.object({
      term: z.string().trim().min(1),
      definition: z.string().trim().min(1),
    })).min(4),

    remediation: z.object({
      passingScore: z.number().int().min(1).max(100),
      reviewMessage: z.string().trim().min(1),
      objectiveMap: z.array(z.string().trim().min(1)).min(3),
      targetedActions: z.array(z.object({
        objective: z.string().trim().min(1),
        action: z.string().trim().min(1),
      })).min(1),
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
    interactiveVideo: z.unknown().optional(),
  })
  .passthrough();

export type CourseExperience = z.infer<typeof CourseExperienceSchema>;
