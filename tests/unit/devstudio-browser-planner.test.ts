import { beforeEach, describe, expect, it, vi } from 'vitest';

const { aiChatMock } = vi.hoisted(() => ({ aiChatMock: vi.fn() }));

vi.mock('@/lib/ai/ai-service', () => ({ aiChat: aiChatMock }));

import {
  browserActionRecords,
  browserTaskMatches,
  planBrowserTurn,
  validateBrowserTurn,
  type BrowserSnapshot,
} from '@/lib/devstudio/browser-planner';

const snapshot: BrowserSnapshot = {
  title: 'Elevate for Humanity',
  url: 'https://www.elevateforhumanity.org/',
  visibleText: 'Career training',
  headings: [{ level: 1, text: 'Build your future' }],
  controls: [
    { ref: 'e1', role: 'link', name: 'Apply', href: 'https://www.elevateforhumanity.org/apply' },
    { ref: 'e2', role: 'input', name: 'Search', type: 'search' },
  ],
};

describe('provider-neutral browser planner validation', () => {
  beforeEach(() => {
    aiChatMock.mockReset();
  });

  it('accepts a completed evidence response without actions', () => {
    expect(
      validateBrowserTurn(
        JSON.stringify({
          status: 'complete',
          actions: [],
          summary: 'Title: Elevate for Humanity; URL: https://www.elevateforhumanity.org/',
        }),
        snapshot,
      ),
    ).toMatchObject({ status: 'complete', actions: [] });
  });

  it('accepts only actions targeting controls in the current snapshot', () => {
    expect(
      validateBrowserTurn(
        JSON.stringify({
          status: 'act',
          actions: [
            { type: 'fill_ref', ref: 'e2', text: 'HVAC' },
            { type: 'press_ref', ref: 'e2', key: 'Enter' },
          ],
          summary: 'Search for HVAC.',
        }),
        snapshot,
      ).actions,
    ).toHaveLength(2);
    expect(() =>
      validateBrowserTurn(
        JSON.stringify({
          status: 'act',
          actions: [{ type: 'click_ref', ref: 'e999' }],
          summary: 'Click an invented control.',
        }),
        snapshot,
      ),
    ).toThrow('unknown control');
  });

  it('rejects arbitrary selectors and executable browser actions', () => {
    for (const action of [
      { type: 'click', selector: 'body > *' },
      { type: 'evaluate', script: 'document.cookie' },
    ]) {
      expect(() =>
        validateBrowserTurn(
          JSON.stringify({ status: 'act', actions: [action], summary: 'Unsafe action.' }),
          snapshot,
        ),
      ).toThrow('not allowed');
    }
  });

  it('rejects actions attached to complete or blocked responses', () => {
    expect(() =>
      validateBrowserTurn(
        JSON.stringify({
          status: 'blocked',
          actions: [{ type: 'navigate', url: 'https://www.elevateforhumanity.org/' }],
          summary: 'Blocked.',
        }),
        snapshot,
      ),
    ).toThrow('cannot contain actions');
  });

  it('redacts typed values from durable browser history', () => {
    expect(
      browserActionRecords([
        { type: 'fill_ref', ref: 'e2', text: 'private value' },
        { type: 'navigate', url: 'https://www.elevateforhumanity.org/' },
      ]),
    ).toEqual([{ type: 'fill_ref', ref: 'e2' }, { type: 'navigate' }]);
  });

  it('matches approval resumes against canonical tool input instead of expanded task text', () => {
    const task = {
      tool_name: 'browser.execute',
      command: 'Browser: inspect Inspect inspect',
      description: 'inspect',
      tool_input: { task: 'inspect', sessionId: 'session-1' },
    };
    expect(browserTaskMatches(task, { command: 'inspect', sessionId: 'session-1' })).toBe(true);
    expect(browserTaskMatches(task, { command: 'inspect', sessionId: 'session-2' })).toBe(false);
    expect(browserTaskMatches(task, { command: 'change it', sessionId: 'session-1' })).toBe(false);
  });

  it('repairs malformed provider JSON once, revalidates it, and accounts for both calls', async () => {
    aiChatMock
      .mockResolvedValueOnce({
        content: JSON.stringify({
          status: 'act',
          actions: [{ ref: 'e1' }],
          summary: 'Click Apply.',
        }),
        provider: 'xai',
        model: 'grok',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      })
      .mockResolvedValueOnce({
        content: JSON.stringify({
          status: 'act',
          actions: [{ type: 'click_ref', ref: 'e1' }],
          summary: 'Click Apply.',
        }),
        provider: 'xai',
        model: 'grok',
        usage: { promptTokens: 12, completionTokens: 4, totalTokens: 16 },
      });

    const turn = await planBrowserTurn({
      command: 'Open the application.',
      instructions: 'Do not leave the Elevate site.',
      snapshot,
      history: [],
    });

    expect(aiChatMock).toHaveBeenCalledTimes(2);
    expect(aiChatMock.mock.calls[1][0].messages[0].content).toContain(
      'Correct the JSON exactly once',
    );
    expect(aiChatMock.mock.calls[1][0].messages[1].content).toContain(
      'Browser planner action is not allowed',
    );
    expect(turn.actions).toEqual([{ type: 'click_ref', ref: 'e1' }]);
    expect(turn.usage).toEqual({ promptTokens: 22, completionTokens: 9, totalTokens: 31 });
  });

  it('remains fail-closed when the single repair response is also invalid', async () => {
    aiChatMock
      .mockResolvedValueOnce({
        content: '{"status":"act","actions":[{}],"summary":"Try it."}',
        provider: 'xai',
        model: 'grok',
      })
      .mockResolvedValueOnce({
        content: '{"status":"act","actions":[{"type":"evaluate"}],"summary":"Try it."}',
        provider: 'xai',
        model: 'grok',
      });

    await expect(
      planBrowserTurn({
        command: 'Open the application.',
        instructions: 'Do not leave the Elevate site.',
        snapshot,
        history: [],
      }),
    ).rejects.toThrow('not allowed');
    expect(aiChatMock).toHaveBeenCalledTimes(2);
  });
});
