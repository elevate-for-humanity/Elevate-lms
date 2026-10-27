import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const button = readFileSync(path.resolve('components/paris/ParisFloatingButton.tsx'), 'utf8');
const chat = readFileSync(path.resolve('components/paris/ParisChat.tsx'), 'utf8');

describe('PARIS close control', () => {
  it('provides a visible, accessible close button and Escape shortcut', () => {
    expect(button).toContain('aria-label="Close PARIS"');
    expect(button).toContain('>Close</span>');
    expect(button).toContain("event.key === 'Escape'");
  });

  it('keeps all three mobile composer controls inside their fixed columns', () => {
    expect(chat.match(/!w-11 !min-w-11 !max-w-11/g)).toHaveLength(3);
    expect(chat.match(/!p-0/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
