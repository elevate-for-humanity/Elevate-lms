import { describe, expect, it } from 'vitest';
import { approvalReason, detectRiskTags, requiresApproval } from '@/lib/devstudio/os/risk';

describe('devstudio/os/risk', () => {
  it('detects risky keywords', () => {
    expect(detectRiskTags('run migration on production')).toEqual(
      expect.arrayContaining(['migration', 'production']),
    );
  });

  it('requires approval when risky', () => {
    expect(requiresApproval('deploy to production')).toBe(true);
    expect(requiresApproval('fix typo in readme')).toBe(false);
  });

  it('builds approval reason', () => {
    expect(approvalReason(['deploy', 'auth'])).toContain('deploy');
  });
});
