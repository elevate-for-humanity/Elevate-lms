import { beforeEach, describe, expect, it, vi } from 'vitest';

const aiChatMock = vi.fn();

vi.mock('../../lib/ai/ai-service', () => ({
  aiChat: aiChatMock,
}));

import { askKnowledge } from '../../lib/ai/knowledge-intelligence';

describe('Elevate knowledge intelligence', () => {
  beforeEach(() => {
    aiChatMock.mockReset();
    aiChatMock.mockResolvedValue({
      content: JSON.stringify({
        answer: 'The latest policy requires supervisor approval.',
        sourceIds: ['policy-v2'],
      }),
      provider: 'elevate',
      model: 'elevate-local',
    });
  });

  it('returns source-grounded citations from allowed source ids only', async () => {
    const result = await askKnowledge({
      mode: 'answer',
      question: 'What approval is required?',
      sources: [
        { id: 'policy-v1', title: 'Policy v1', content: 'Older policy.', updatedAt: '2026-01-01' },
        { id: 'policy-v2', title: 'Policy v2', content: 'Supervisor approval is required.', updatedAt: '2026-08-01' },
      ],
    });

    expect(result.answer).toContain('supervisor approval');
    expect(result.citations).toEqual([{ sourceId: 'policy-v2', title: 'Policy v2' }]);
    const system = aiChatMock.mock.calls[0][0].messages[0].content;
    expect(system).toContain('only evidence');
    expect(system).toContain('flag conflicts');
  });

  it('drops hallucinated citation ids', async () => {
    aiChatMock.mockResolvedValueOnce({
      content: JSON.stringify({ answer: 'Supported answer', sourceIds: ['source-1', 'made-up'] }),
      provider: 'elevate',
      model: 'local',
    });

    const result = await askKnowledge({
      mode: 'summarize',
      question: 'Summarize this source.',
      sources: [{ id: 'source-1', title: 'Source 1', content: 'Real content.' }],
    });

    expect(result.sourceIds).toEqual(['source-1']);
  });
});
