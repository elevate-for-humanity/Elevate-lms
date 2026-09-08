import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('Admin document review mobile layout', () => {
  const source = readFileSync('apps/admin/app/documents/review/page.tsx', 'utf8');

  it('stacks document details and actions before the small breakpoint', () => {
    expect(source).toContain('flex flex-col items-stretch gap-4');
    expect(source).toContain('sm:flex-row sm:items-center sm:justify-between');
    expect(source).toContain('flex min-w-0 flex-1 items-start gap-3');
    expect(source).toContain('flex w-full flex-wrap items-center gap-3 sm:w-auto sm:shrink-0');
  });

  it('keeps long uploaded filenames and metadata readable', () => {
    expect(source).toContain('break-words font-semibold text-black');
    expect(source).toContain('mt-1 break-words text-sm text-black');
  });
});
