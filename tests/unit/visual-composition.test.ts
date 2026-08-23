import { beforeEach, describe, expect, it, vi } from 'vitest';

const { aiChatMock } = vi.hoisted(() => ({
  aiChatMock: vi.fn(),
}));

vi.mock('../../lib/ai/ai-service', () => ({
  aiChat: aiChatMock,
}));

import { composeVisual } from '../../lib/ai/visual-composition';

describe('Elevate visual composition intelligence', () => {
  beforeEach(() => {
    aiChatMock.mockReset();
    aiChatMock.mockResolvedValue({
      content: JSON.stringify({
        title: 'Medical Assistant',
        subtitle: 'Train for a healthcare career',
        narrative: 'Career-focused training overview',
        layout: 'split hero',
        hierarchy: ['title', 'outcome', 'cta'],
        copy: [{ role: 'cta', text: 'Apply Now' }],
        visualPrompt: 'Professional healthcare training environment',
        dataPoints: [],
        refinements: ['Increase image prominence'],
        accessibility: { altText: 'Students training in a clinical classroom', readingOrder: ['title', 'outcome', 'cta'] },
      }),
      provider: 'elevate',
      model: 'elevate-local',
    });
  });

  it('preserves theme context and uses the canonical AI router', async () => {
    const result = await composeVisual({
      mode: 'beautify',
      instruction: 'Make this more visual without changing the facts.',
      target: 'hero',
      current: { title: 'Medical Assistant', duration: '21 weeks' },
      sourceContext: { duration: '21 weeks' },
      theme: { brandName: 'Elevate for Humanity', tone: 'premium workforce institution' },
    });

    expect(result.provider).toBe('elevate');
    expect(result.layout).toBe('split hero');
    const request = aiChatMock.mock.calls[0][0];
    expect(request.messages[0].content).toContain('Do not replace established brand identity');
    expect(request.messages[0].content).toContain('Do not invent credentials');
    expect(request.messages[1].content).toContain('21 weeks');
  });

  it('asks for data-rich visuals without invented facts', async () => {
    await composeVisual({
      mode: 'infographic',
      instruction: 'Turn these outcomes into an infographic.',
      target: 'infographic',
      sourceContext: { completionRate: '84%' },
    });

    const system = aiChatMock.mock.calls[0][0].messages[0].content;
    expect(system).toContain('without inventing statistics');
    expect(system).toContain('dataPoints must only contain facts');
  });
});
