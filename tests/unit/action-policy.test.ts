import { describe, expect, it } from 'vitest';

import { evaluateActionPolicy } from '../../lib/ellie/action-policy';

describe('closed-loop action policy', () => {
  it('allows AUTO actions in autonomous mode', () => {
    expect(evaluateActionPolicy('send_reminder', { mode: 'autonomous' })).toMatchObject({
      allowed: true,
      policy: 'AUTO',
    });
  });

  it('blocks APPROVAL actions in autonomous mode', () => {
    expect(evaluateActionPolicy('approve_application', { mode: 'autonomous' })).toMatchObject({
      allowed: false,
      policy: 'APPROVAL',
    });
  });

  it('blocks prohibited autonomous certificate issuance', () => {
    expect(evaluateActionPolicy('issue_certificate', { mode: 'autonomous', preconditionsVerified: true })).toMatchObject({
      allowed: false,
      policy: 'PROHIBITED_AUTONOMOUS',
    });
  });

  it('requires deterministic verification for RULE_VERIFIED actions', () => {
    expect(evaluateActionPolicy('flag_at_risk', { mode: 'autonomous' }).allowed).toBe(false);
    expect(evaluateActionPolicy('flag_at_risk', { mode: 'autonomous', preconditionsVerified: true }).allowed).toBe(true);
  });

  it('permits actions after an explicit authorized human approval', () => {
    expect(evaluateActionPolicy('reject_application', { mode: 'human_approved', actorId: 'admin-1' })).toMatchObject({
      allowed: true,
      policy: 'APPROVAL',
    });
  });
});
