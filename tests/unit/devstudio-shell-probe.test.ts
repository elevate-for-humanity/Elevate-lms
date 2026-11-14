import { describe, expect, it } from 'vitest';
import { shellHealthUrl } from '@/lib/devstudio/shell-probe';

describe('shellHealthUrl', () => {
  it('converts ws service discovery URL to http /health', () => {
    expect(shellHealthUrl('ws://elevate-studio.elevate.local:8888')).toBe(
      'http://elevate-studio.elevate.local:8888/health',
    );
  });

  it('returns null for empty input', () => {
    expect(shellHealthUrl('')).toBeNull();
  });
});
