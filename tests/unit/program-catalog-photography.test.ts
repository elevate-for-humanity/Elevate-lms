import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PROGRAMS } from '@/lib/programs-data';

describe('program-specific catalog photography', () => {
  it('assigns distinct existing photograph assets to every catalog program', () => {
    const photos = PROGRAMS.map((program) => program.image);
    expect(photos).not.toContain('/images/pages/comp-home-hero.webp');
    expect(new Set(photos).size).toBe(PROGRAMS.length);
    const hashes = photos.map((photo) => createHash('sha256').update(readFileSync(`public${photo}`)).digest('hex'));
    expect(new Set(hashes).size).toBe(PROGRAMS.length);
  });
});
