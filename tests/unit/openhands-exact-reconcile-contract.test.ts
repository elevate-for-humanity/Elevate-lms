// @vitest-environment node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// The OpenHands reconcile cron route was deleted with the rest of the
// OpenHands surface (route removal, 2026-11-25). This contract now guards
// the removal itself: the endpoint must stay gone so the retired provider
// path cannot silently come back.
describe('OpenHands reconciliation route removal contract', () => {
  it('has no openhands-reconcile cron route file in the Admin app', () => {
    const routePath = path.join(
      process.cwd(),
      'apps/admin/app/api/cron/openhands-reconcile/route.ts',
    );
    expect(existsSync(routePath)).toBe(false);
  });

  it('has no openhands-reconcile cron route directory in the Admin app', () => {
    const dirPath = path.join(
      process.cwd(),
      'apps/admin/app/api/cron/openhands-reconcile',
    );
    expect(existsSync(dirPath)).toBe(false);
  });
});
