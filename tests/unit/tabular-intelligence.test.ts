import { beforeEach, describe, expect, it, vi } from 'vitest';

const { aiChatMock } = vi.hoisted(() => ({
  aiChatMock: vi.fn(),
}));

vi.mock('../../lib/ai/ai-service', () => ({
  aiChat: aiChatMock,
}));

import {
  runTabularIntelligence,
  runTabularIntelligenceBatch,
} from '../../lib/ai/tabular-intelligence';

describe('Elevate tabular intelligence', () => {
  beforeEach(() => {
    aiChatMock.mockReset();
    aiChatMock.mockResolvedValue({
      content: 'needs documentation',
      provider: 'elevate',
      model: 'elevate-local',
    });
  });

  it('uses the existing AI router and preserves provider metadata', async () => {
    const result = await runTabularIntelligence({
      mode: 'summarize',
      instruction: 'Summarize the record and identify missing evidence.',
      row: {
        participant: 'Example Learner',
        attendance: '92%',
        evidence_received: false,
      },
      outputKey: 'review_summary',
    });

    expect(aiChatMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      value: 'needs documentation',
      mode: 'summarize',
      outputKey: 'review_summary',
      provider: 'elevate',
      model: 'elevate-local',
    });

    const request = aiChatMock.mock.calls[0][0];
    expect(request.messages[0].content).toContain('Elevate Tabular Intelligence');
    expect(request.messages[0].content).toContain('Never approve eligibility');
    expect(request.messages[1].content).toContain('Example Learner');
  });

  it('constrains categorization to supplied labels', async () => {
    await runTabularIntelligence({
      mode: 'categorize',
      instruction: 'Classify the follow-up state.',
      row: { status: 'pending', documents_complete: false },
      categories: ['ready', 'needs_documents', 'needs_review'],
    });

    const request = aiChatMock.mock.calls[0][0];
    expect(request.messages[0].content).toContain(
      'Allowed categories: ready, needs_documents, needs_review.',
    );
  });

  it('processes batches without changing request order', async () => {
    aiChatMock
      .mockResolvedValueOnce({ content: 'first', provider: 'elevate', model: 'local' })
      .mockResolvedValueOnce({ content: 'second', provider: 'elevate', model: 'local' });

    const results = await runTabularIntelligenceBatch([
      { mode: 'extract', instruction: 'Extract status', row: { status: 'first' } },
      { mode: 'extract', instruction: 'Extract status', row: { status: 'second' } },
    ], 2);

    expect(results.map((result) => result.value)).toEqual(['first', 'second']);
  });
});
