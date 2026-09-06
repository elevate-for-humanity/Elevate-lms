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

  it('does not turn safety prohibitions into requested high-impact actions', () => {
    expect(
      requiresApproval(
        'Open the homepage and report its title. Do not click, submit, publish, message, purchase, or change anything.',
      ),
    ).toBe(false);
  });

  it('still detects an action after negation scope is explicitly reset', () => {
    expect(requiresApproval('Do not inspect it; instead deploy to production.')).toBe(true);
  });

  it('builds approval reason', () => {
    expect(approvalReason(['deploy', 'auth'])).toContain('deploy');
  });
});
