import { z } from 'zod';

export const QuizQuestionSchema = z.object({
  question: z.string().min(10, 'Question too short'),
  options: z.array(z.string().min(1)).length(4, 'Must have exactly 4 options'),
  correct_answer: z.string().min(1),
  explanation: z.string().min(10, 'Explanation too short'),
});

export const SlideSectionSchema = z.object({
  slide_number: z.number().int().positive(),
  title: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(3).max(6),
  speaker_notes: z.string().min(20, 'Speaker notes too short'),
  visual_suggestion: z.string().optional(),
});

export const CompiledLessonSchema = z.object({
  lesson_title: z.string().min(1),
  lesson_objectives: z.array(z.string().min(1)).min(2).max(6),
  estimated_minutes: z.number().int().min(3).max(60),
  narration_script: z.string().min(400, 'Narration script too short — minimum 400 characters'),
  slide_outline: z.array(SlideSectionSchema).min(4).max(12),
  practice_exercise: z.object({
    title: z.string().min(1),
    instructions: z.string().min(20),
    expected_outcome: z.string().min(10),
  }),
  knowledge_check: z.array(QuizQuestionSchema).length(5, 'Must have exactly 5 quiz questions'),
  instructor_notes: z.array(z.string().min(10)).min(2).max(8),
});

export type CompiledLesson = z.infer<typeof CompiledLessonSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type SlideSection = z.infer<typeof SlideSectionSchema>;
