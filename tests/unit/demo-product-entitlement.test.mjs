import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveDemoProductEntitlement } from '../../lib/store/demo-product-entitlement.mjs';

test('individual app demos grant that app subscription, never a hard-coded default', () => {
  assert.deepEqual(resolveDemoProductEntitlement('website-builder'), {
    kind: 'individual_app',
    appSlug: 'website-builder',
  });
  assert.deepEqual(resolveDemoProductEntitlement('sam-gov'), {
    kind: 'individual_app',
    appSlug: 'sam-gov',
  });
  assert.deepEqual(resolveDemoProductEntitlement('grants'), {
    kind: 'individual_app',
    appSlug: 'grants',
  });
  // Aliases used by the capability demos.
  assert.equal(resolveDemoProductEntitlement('sam_gov_manager').appSlug, 'sam-gov');
  assert.equal(resolveDemoProductEntitlement('grants_discovery').appSlug, 'grants');
});

test('workspace products convert to the workspace trial', () => {
  for (const key of ['platform', 'community-hub', 'business', 'professional', 'employer', 'student']) {
    assert.deepEqual(resolveDemoProductEntitlement(key), { kind: 'workspace' });
  }
});

test('unknown or missing keys never mis-provision an individual app', () => {
  assert.deepEqual(resolveDemoProductEntitlement(undefined), { kind: 'workspace' });
  assert.deepEqual(resolveDemoProductEntitlement(''), { kind: 'workspace' });
  assert.deepEqual(resolveDemoProductEntitlement('something-new'), { kind: 'workspace' });
});

test('matching is case- and whitespace-insensitive', () => {
  assert.equal(resolveDemoProductEntitlement('  SAM-Gov ').appSlug, 'sam-gov');
  assert.equal(resolveDemoProductEntitlement('GRANTS').appSlug, 'grants');
});
