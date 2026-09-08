import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const button = readFileSync(
  path.resolve('components/paris/ParisFloatingButton.tsx'),
  'utf8',
);

describe('PARIS close control', () => {
  it('provides a visible, accessible close button and Escape shortcut', () => {
    expect(button).toContain('aria-label="Close PARIS"');
    expect(button).toContain('>Close</span>');
    expect(button).toContain("event.key === 'Escape'");
  });
});
