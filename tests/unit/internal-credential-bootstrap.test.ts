// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { planTokenBootstrap, bootstrap } from '../../scripts/gcp/bootstrap-internal-token.mjs';

describe('internal credential bootstrap', () => {
  it('is dry-run only unless apply is explicit', () => {
    const plan = planTokenBootstrap({component:'admin',key:'STUDIO_BROWSER_SECRET'});
    expect(plan.apply).toBe(false);
    expect(bootstrap(plan)).toMatchObject({status:'dry-run',changed:false});
  });
  it('does not generate provider-owned credentials', () => {
    expect(() => planTokenBootstrap({component:'admin',key:'TWILIO_AUTH_TOKEN',apply:true})).toThrow();
    expect(() => planTokenBootstrap({component:'admin',key:'PAYPAL_CLIENT_SECRET',apply:true})).toThrow();
  });
  it('rejects unapproved service/key pairs', () => {
    expect(() => planTokenBootstrap({component:'store',key:'STUDIO_BROWSER_SECRET'})).toThrow();
    expect(() => planTokenBootstrap({component:'unknown',key:'CRON_SECRET'})).toThrow();
  });
});
