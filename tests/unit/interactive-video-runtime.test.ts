import { describe, expect, it } from 'vitest';
import { normalizeInteractiveVideoExperience } from '@/lib/lms/interactive-video';

describe('normalizeInteractiveVideoExperience', () => {
  it('normalizes every supported checkpoint and sorts by timestamp', () => {
    const result = normalizeInteractiveVideoExperience({
      interactiveVideo: {
        transcript: [{ start: 0, end: 5, text: 'Sanitize the workstation.' }],
        checkpoints: [
          { type: 'reflection', timestamp: 40, prompt: 'Explain why sanitation matters.', minChars: 20 },
          { type: 'hotspot', timestamp: 10, prompt: 'Select the disinfectant.', areas: [
            { label: 'EPA-registered disinfectant', correct: true, info: 'Correct.' },
            { label: 'Plain water', correct: false, info: 'Water alone is insufficient.' },
          ] },
          { type: 'scenario', timestamp: 20, situation: 'A tool falls on the floor. What next?', choices: [
            { text: 'Reuse it', correct: false, feedback: 'It is contaminated.' },
            { text: 'Replace and disinfect it', correct: true, feedback: 'Correct.' },
          ] },
          { type: 'key-concept', timestamp: 30, concept: 'Prevent cross-contamination', bullets: ['Use clean tools'] },
          { type: 'quiz', timestamp: 5, question: 'What comes first?', options: ['Sanitation', 'Service'], answer: 0, explanation: 'Protect the client first.' },
        ],
      },
    });

    expect(result.validationErrors).toEqual([]);
    expect(result.checkpoints.map((checkpoint) => checkpoint.type)).toEqual([
      'quiz',
      'hotspot',
      'scenario',
      'key-concept',
      'reflection',
    ]);
    expect(result.transcript).toEqual([
      { start: 0, end: 5, text: 'Sanitize the workstation.' },
    ]);
  });

  it('reports malformed checkpoints instead of silently publishing them', () => {
    const result = normalizeInteractiveVideoExperience({
      interactiveVideo: {
        checkpoints: [
          { type: 'quiz', timestamp: 5, question: '', options: [], answer: 4 },
          { type: 'unsupported', timestamp: 10 },
        ],
      },
    });

    expect(result.checkpoints).toEqual([]);
    expect(result.validationErrors).toHaveLength(2);
  });

  it('uses lesson knowledge checks when interactive video quizzes are absent', () => {
    const result = normalizeInteractiveVideoExperience({
      knowledgeChecks: [{
        question: 'Which action protects the patron?',
        options: ['Disinfect tools', 'Reuse dirty tools'],
        correct: 0,
        explanation: 'Disinfection reduces cross-contamination.',
        timestamp: 12,
      }],
    });

    expect(result.checkpoints).toEqual([
      {
        type: 'quiz',
        timestamp: 12,
        question: 'Which action protects the patron?',
        options: ['Disinfect tools', 'Reuse dirty tools'],
        answer: 0,
        explanation: 'Disinfection reduces cross-contamination.',
      },
    ]);
  });

  it('rejects invalid transcript timing', () => {
    const result = normalizeInteractiveVideoExperience({
      interactiveVideo: {
        transcript: [{ start: 9, end: 3, text: 'Invalid segment' }],
        checkpoints: [],
      },
    });

    expect(result.transcript).toEqual([]);
  });
});
