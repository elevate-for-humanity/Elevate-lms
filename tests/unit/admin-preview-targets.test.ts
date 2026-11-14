import { describe, expect, it } from 'vitest';
import { mergePreviewTargets } from '@/lib/admin/merge-preview-targets';

describe('mergePreviewTargets', () => {
  it('prefers config targets and appends unique dashboard targets', () => {
    const merged = mergePreviewTargets(
      [
        { label: 'Public Site', url: 'https://www.elevateforhumanity.org' },
        { label: 'Blog', url: 'https://www.elevateforhumanity.org/blog' },
      ],
      [
        { label: 'Programs', url: 'https://www.elevateforhumanity.org/programs' },
      ],
    );
    // Config targets come first (Programs)
    expect(merged[0]?.label).toBe('Programs');
    // Dashboard targets appended if unique
    expect(merged.some((t) => t.label === 'Public Site')).toBe(true);
    expect(merged.some((t) => t.label === 'Blog')).toBe(true);
    expect(merged.length).toBe(3);
  });

  it('falls back to dashboard-only when config is empty', () => {
    const dashboard = [{ label: 'LMS', url: 'https://lms.example.com' }];
    expect(mergePreviewTargets(dashboard, undefined)).toEqual(dashboard);
  });

  it('dedupes targets with same origin+path', () => {
    const merged = mergePreviewTargets(
      [{ label: 'A', url: 'https://example.com' }],
      [{ label: 'B', url: 'https://example.com/' }],
    );
    // Only one should survive dedup
    expect(merged.length).toBe(1);
  });
});
