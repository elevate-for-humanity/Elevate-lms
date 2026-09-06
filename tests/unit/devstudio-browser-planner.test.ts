import { describe, expect, it } from 'vitest';
import {
  browserActionRecords,
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
});
