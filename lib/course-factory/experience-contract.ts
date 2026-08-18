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
    content: z.string().min(500).max(50000).optional(),
    narrationScript: z.string().trim().min(200).max(20000),
    visualPrompt: z.string().trim().min(40).max(4000),
    flashcards: z
      .array(
        z.object({
          id: z.string().optional(),
          front: z.string().trim().min(1),
          back: z.string().trim().min(1),
          tags: z.array(z.string()).default([]),
        }),
      )
      .min(4),
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
    practicalTask: z.object({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      instructions: z.array(z.string().trim().min(1)).min(3),
      evidence: z.string().trim().min(1),
    }),
    remediation: z.object({
      passingScore: z.number().int().min(1).max(100),
      reviewMessage: z.string().trim().min(1),
      objectiveMap: z.array(z.string().trim().min(1)).min(3),
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
