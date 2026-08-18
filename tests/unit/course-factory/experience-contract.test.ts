import { describe, expect, it } from 'vitest';
import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';

const completeExperience = {
  narrationScript:
    'A complete instructor narration grounded in the lesson content explains the objective, demonstrates the workflow, names the evidence a learner must inspect, shows the quality checkpoint, and closes with a measurable workplace result and a clear transition into applied practice.',
  visualPrompt: 'Bright Elevate visual showing a real workforce decision and its measurable result.',
  flashcards: Array.from({ length: 4 }, (_, index) => ({
    id: `card-${index + 1}`,
    front: `Term ${index + 1}`,
    back: `Course-specific explanation ${index + 1}`,
    tags: ['objective'],
  })),
  knowledgeChecks: Array.from({ length: 3 }, (_, index) => ({
    question: `Applied question ${index + 1}?`,
    options: ['Correct decision', 'Distractor', 'Distractor', 'Distractor'],
    correct: 0,
    explanation: 'The correct decision uses the required evidence.',
  })),
  scenario: {
    title: 'Applied decision',
    context: 'A learner must choose the correct evidence-based action.',
    question: 'What should the learner do?',
    options: [
      { text: 'Use the evidence', isCorrect: true, feedback: 'Correct.' },
      { text: 'Guess', isCorrect: false, feedback: 'Review the evidence.' },
    ],
  },
  caseStudy: {
    title: 'Evidence review',
    context: 'A workplace result requires analysis.',
    question: 'Which conclusion is supported?',
    options: [
      { text: 'The supported conclusion', isCorrect: true, feedback: 'Correct.' },
      { text: 'An unsupported claim', isCorrect: false, feedback: 'Review the record.' },
    ],
  },
  practicalTask: {
    title: 'Produce an artifact',
    description: 'Create evidence of applied competence.',
    instructions: ['Review requirements', 'Complete the task', 'Verify the result'],
    evidence: 'A completed artifact and verification record.',
  },
  remediation: {
    passingScore: 80,
    reviewMessage: 'Review missed objectives and retry.',
    objectiveMap: ['Objective 1', 'Objective 2', 'Objective 3'],
  },
};

describe('CourseExperienceSchema', () => {
  it('accepts a complete universal lesson experience', () => {
    expect(CourseExperienceSchema.safeParse(completeExperience).success).toBe(true);
  });

  it('rejects incomplete generic lesson output', () => {
    const incomplete = { ...completeExperience, flashcards: [], knowledgeChecks: [] };
    expect(CourseExperienceSchema.safeParse(incomplete).success).toBe(false);
  });
});
