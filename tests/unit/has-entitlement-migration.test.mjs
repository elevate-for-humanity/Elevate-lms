import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(
  new URL('../../supabase/migrations/20261108120000_has_entitlement_rpc.sql', import.meta.url),
  'utf8',
);

test('has_entitlement exists and is callable by the service role only', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.has_entitlement\(\s*p_user_id uuid,\s*p_entitlement_key text\s*\)/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.has_entitlement\(uuid, text\) TO service_role/);
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.has_entitlement\(uuid, text\) FROM PUBLIC, anon, authenticated/);
});

test('has_entitlement requires an active, unrevoked, unexpired entitlement', () => {
  // Canonical table.
  assert.match(sql, /FROM public\.user_entitlements/);
  assert.match(sql, /status = 'active'/);
  assert.match(sql, /revoked_at IS NULL/);
  // Legacy table and its expiry.
  assert.match(sql, /FROM public\.store_entitlements/);
  assert.match(sql, /expires_at IS NULL OR s\.expires_at > now\(\)/);
});

test('the legacy store_entitlements columns the readers use are added', () => {
  for (const column of ['user_id', 'entitlement_code', 'is_active', 'expires_at', 'stripe_payment_intent_id']) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`), `missing ${column}`);
  }
});
