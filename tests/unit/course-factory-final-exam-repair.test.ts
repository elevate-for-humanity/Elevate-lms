import { beforeEach, describe, expect, it, vi } from 'vitest';

const { aiChatMock, loadPartialAssessmentCheckpointMock } = vi.hoisted(() => ({
  aiChatMock: vi.fn(),
  loadPartialAssessmentCheckpointMock: vi.fn(),
}));

vi.mock('@/lib/ai/ai-service', () => ({
  aiChat: aiChatMock,
  isAIAvailable: () => true,
}));

vi.mock('@/lib/course-factory/generation-checkpoints', () => ({
  loadAssessmentCheckpoint: vi.fn(),
  loadPartialAssessmentCheckpoint: loadPartialAssessmentCheckpointMock,
  loadLessonGenerationCheckpoint: vi.fn(),
  persistAssessmentCheckpoint: vi.fn(),
  persistLessonGenerationCheckpoint: vi.fn(),
}));

import { generateFinalExam } from '@/lib/course-factory/content-generator';

function response(start: number, count: number) {
  return {
    content: JSON.stringify({
      questions: Array.from({ length: count }, (_, index) => ({
        question: `Unique question ${start + index}?`,
        options: ['A', 'B', 'C', 'D'],
        correct: 0,
        explanation: 'The first option is correct.',
      })),
    }),
  };
}

describe('generateFinalExam gap repair', () => {
  beforeEach(() => {
    aiChatMock.mockReset();
    loadPartialAssessmentCheckpointMock.mockReset();
    loadPartialAssessmentCheckpointMock.mockResolvedValue(null);
  });

  it('returns a complete persisted checkpoint without spending another LLM call', async () => {
    const checkpoint = JSON.parse(response(1, 25).content).questions;
    loadPartialAssessmentCheckpointMock.mockResolvedValueOnce(checkpoint);

    const exam = await generateFinalExam(
      'Indiana Cosmetology License',
      8,
      25,
      [],
      'cosmo-final-exam',
    );

    expect(exam.questions).toHaveLength(25);
    expect(aiChatMock).not.toHaveBeenCalled();
  });

  it('keeps valid questions and requests only the missing remainder', async () => {
    aiChatMock.mockResolvedValueOnce(response(1, 24)).mockResolvedValueOnce(response(25, 1));

    const exam = await generateFinalExam('Indiana Cosmetology License', 8, 25);

    expect(exam.questions).toHaveLength(25);
    expect(aiChatMock).toHaveBeenCalledTimes(2);
    expect(aiChatMock.mock.calls[1][0].messages[1].content).toContain(
      'Generate exactly 1 replacement questions',
    );
  });

  it('deduplicates repair output and continues within the bounded retry budget', async () => {
    aiChatMock
      .mockResolvedValueOnce(response(1, 24))
      .mockResolvedValueOnce(response(24, 1))
      .mockResolvedValueOnce(response(25, 1));

    const exam = await generateFinalExam('Indiana Cosmetology License', 8, 25);

    expect(exam.questions).toHaveLength(25);
    expect(aiChatMock).toHaveBeenCalledTimes(3);
  });

  it('normalizes provider aliases during a targeted repair', async () => {
    aiChatMock.mockResolvedValueOnce(response(1, 23)).mockResolvedValueOnce({
      content: JSON.stringify({
        questions: [
          {
            question: 'Unique question 24?',
            options: ['A', 'B', 'C', 'D'],
            correct_index: 0,
            rationale: 'The first option is correct.',
          },
          {
            question: 'Unique question 25?',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: 'A',
            feedback: 'The first option is correct.',
          },
        ],
      }),
    });

    const exam = await generateFinalExam('Indiana Cosmetology License', 8, 25);

    expect(exam.questions).toHaveLength(25);
    expect(exam.questions[23]).toMatchObject({
      correct: 0,
      explanation: 'The first option is correct.',
    });
    expect(exam.questions[24]).toMatchObject({
      correct: 0,
      explanation: 'The first option is correct.',
    });
  });

  it('keeps valid questions when another repair candidate is malformed', async () => {
    aiChatMock
      .mockResolvedValueOnce(response(1, 23))
      .mockResolvedValueOnce({
        content: JSON.stringify({
          questions: [
            {
              question: 'Unique question 24?',
              options: ['A', 'B', 'C', 'D'],
              correct: 0,
              explanation: 'The first option is correct.',
            },
            { question: 'Invalid question?', options: ['A', 'B'], correct: null },
          ],
        }),
      })
      .mockResolvedValueOnce(response(25, 1));

    const exam = await generateFinalExam('Indiana Cosmetology License', 8, 25);

    expect(exam.questions).toHaveLength(25);
    expect(aiChatMock).toHaveBeenCalledTimes(3);
  });
});
