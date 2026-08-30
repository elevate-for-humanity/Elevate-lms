import { beforeEach, describe, expect, it, vi } from 'vitest';

const { aiChatMock } = vi.hoisted(() => ({ aiChatMock: vi.fn() }));

vi.mock('@/lib/ai/ai-service', () => ({
  aiChat: aiChatMock,
  isAIAvailable: () => true,
}));

vi.mock('@/lib/course-factory/generation-checkpoints', () => ({
  loadAssessmentCheckpoint: vi.fn(),
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
  beforeEach(() => aiChatMock.mockReset());

  it('keeps valid questions and requests only the missing remainder', async () => {
    aiChatMock.mockResolvedValueOnce(response(1, 24)).mockResolvedValueOnce(response(25, 1));

    const exam = await generateFinalExam('Indiana Cosmetology License', 8, 25);

    expect(exam.questions).toHaveLength(25);
    expect(aiChatMock).toHaveBeenCalledTimes(2);
    expect(aiChatMock.mock.calls[1][0].messages[1].content).toContain(
      'Generate exactly 1 additional original questions',
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
});

