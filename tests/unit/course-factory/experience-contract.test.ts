import { describe, expect, it } from 'vitest';
import { CourseExperienceSchema } from '@/lib/course-factory/experience-contract';

const completeExperience = {
  readingGuide: {
    title: 'Evidence-based workplace decisions',
    summary:
      'This guide connects the lesson objective to a documented workplace decision, the evidence that supports it, and the quality checks a learner uses before completing applied practice.',
    sections: [
      {
        heading: 'Recognize the evidence',
        body: 'Begin by identifying the source records, observable conditions, and stated requirements that govern the decision. Confirm that each source is current, relevant to the workplace task, and specific enough to support an action instead of a guess.',
      },
      {
        heading: 'Apply the decision process',
        body: 'Compare the available evidence with the task requirements, select the supported action, and record why the alternatives do not satisfy the requirement. This creates a repeatable process that another reviewer can follow and verify.',
      },
      {
        heading: 'Verify the result',
        body: 'Inspect the completed work against the stated quality criteria, document the result, and correct any gap before submission. Verification turns activity into measurable evidence of competence and supports reliable progress reporting.',
      },
    ],
    keyTakeaways: ['Use current evidence', 'Document the decision', 'Verify the result'],
  },
  narrationScript:
    'A complete instructor narration grounded in the lesson content explains the objective, demonstrates the workflow, names the evidence a learner must inspect, shows the quality checkpoint, and closes with a measurable workplace result and a clear transition into applied practice.',
  visualPrompt:
    'Bright Elevate visual showing a real workforce decision and its measurable result.',
  flashcards: Array.from({ length: 6 }, (_, index) => ({
    id: `card-${index + 1}`,
    front: `Term ${index + 1}`,
    back: `Course-specific explanation ${index + 1}`,
    tags: ['objective'],
  })),
  quickClips: Array.from({ length: 2 }, (_, index) => ({
    id: `clip-${index + 1}`,
    title: `Evidence clip ${index + 1}`,
    objective: `Apply objective ${index + 1}`,
    durationSeconds: 90,
    script:
      'The instructor demonstrates how to identify the governing evidence, compare it with the task requirement, select the supported action, and document a measurable verification result before the learner begins applied practice.',
    visualPrompt:
      'Bright Elevate workforce learning scene with an instructor, learner, evidence checklist, and visible quality result.',
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
  exercises: [
    {
      id: 'exercise-1',
      title: 'Evidence decision practice',
      instructions: ['Review the supplied evidence', 'Record and verify the supported decision'],
      expectedArtifact: 'A completed decision record with verification evidence.',
      autoGrade: {
        type: 'checklist' as const,
        criteria: ['Evidence identified', 'Decision documented', 'Result verified'],
      },
    },
  ],
  practicalTask: {
    title: 'Produce an artifact',
    description: 'Create evidence of applied competence.',
    instructions: ['Review requirements', 'Complete the task', 'Verify the result'],
    evidence: 'A completed artifact and verification record.',
  },
  resources: [
    {
      type: 'worksheet' as const,
      title: 'Evidence decision worksheet',
      description: 'Capture the governing evidence, selected action, and verification result.',
      content:
        'Evidence source:\nTask requirement:\nSupported action:\nVerification method:\nMeasured result:',
    },
    {
      type: 'checklist' as const,
      title: 'Quality verification checklist',
      description: 'Confirm that the applied task satisfies every lesson quality requirement.',
      content:
        'Current evidence used\nDecision rationale recorded\nArtifact completed\nResult inspected\nCorrection documented',
    },
  ],
  glossary: [
    { term: 'Evidence', definition: 'A record or observation that supports a conclusion.' },
    { term: 'Requirement', definition: 'A condition the completed task must satisfy.' },
    { term: 'Artifact', definition: 'The work product created during applied practice.' },
    { term: 'Verification', definition: 'A documented check that the result meets its criteria.' },
  ],
  remediation: {
    passingScore: 80,
    reviewMessage: 'Review missed objectives and retry.',
    objectiveMap: ['Objective 1', 'Objective 2', 'Objective 3'],
    targetedActions: [
      {
        objective: 'Objective 1',
        action: 'Review the evidence guide and repeat the decision exercise.',
      },
    ],
  },
  readiness: {
    domainKey: 'evidence_decisions',
    masteryThreshold: 80,
    evidenceSignals: ['Knowledge check score', 'Exercise artifact', 'Practical verification'],
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
