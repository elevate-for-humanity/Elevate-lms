import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import postcss from 'postcss';

describe('marketing component sizing and contrast', () => {
  it('keeps generic color, heading-size, button-padding and mobile spacing defaults below utilities', () => {
    const css = postcss.parse(readFileSync('apps/marketing/app/globals.css', 'utf8'));
    const unsafe: string[] = [];
    css.walkRules(rule => {
      // The app's root canvas color is inherited; it cannot override a descendant CTA.
      // Body font size and padding still belong below component utilities.
      const rootCanvasOnly = rule.selectors.every(selector => ['html', 'body'].includes(selector.trim())) && !rule.nodes.some(node => node.type === 'decl' && /^(?:font-size|padding)/.test(node.prop));
      if (rootCanvasOnly) return;
      const generic = rule.selectors.some(selector => /^(?:body|button|a|a:hover|footer|h[1-6]|main [ap]|section [ap]|article [ap]|main section)$/.test(selector.trim()));
      if (!generic || !rule.nodes.some(node => node.type === 'decl' && /^(?:color|font-size|padding(?:-top|-bottom)?)$/.test(node.prop))) return;
      let parent = rule.parent;
      let base = false;
      let print = false;
      while (parent && parent.type !== 'root') {
        if (parent.type === 'atrule') {
          if (parent.name === 'layer' && parent.params === 'base') base = true;
          if (parent.name === 'media' && parent.params.includes('print')) print = true;
        }
        parent = parent.parent;
      }
      if (!base && !print) unsafe.push(rule.selector);
    });
    expect(unsafe).toEqual([]);
  });
});
