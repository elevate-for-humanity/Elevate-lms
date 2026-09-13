import { describe, expect, it } from 'vitest';
import { approvalReason, detectRiskTags, requiresApproval } from '@/lib/devstudio/os/risk';

describe('devstudio/os/risk', () => {
  it('does not classify natural-language requests by keyword', () => {
    expect(detectRiskTags('run migration on production')).toEqual([]);
  });

  it('does not block a task before a concrete tool is selected', () => {
    expect(requiresApproval('deploy to production')).toBe(false);
    expect(requiresApproval('fix typo in readme')).toBe(false);
  });

  it('does not turn safety prohibitions into requested high-impact actions', () => {
    expect(
      requiresApproval(
        'Open the homepage and report its title. Do not click, submit, publish, message, purchase, or change anything.',
      ),
    ).toBe(false);
  });

  it('does not infer authorization requirements from sentence structure', () => {
    expect(requiresApproval('Do not inspect it; instead deploy to production.')).toBe(false);
  });

  it('does not gate read-only inspection of protected workflow state', () => {
    expect(
      requiresApproval(
        'Scan the website builder and inspect the publish flow, deployment status, and delete button. Do not publish or delete content.',
      ),
    ).toBe(false);
  });

  it('builds approval reason', () => {
    expect(approvalReason(['deploy', 'auth'])).toContain('deploy');
  });
});
