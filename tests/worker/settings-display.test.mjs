import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { platformSettingDisplayValue } from '../../lib/settings-display.mjs';

test('legacy credentials and unknown settings never render their payload', () => {
  for (const key of ['SUPABASE_SERVICE_ROLE_KEY', 'SSN_SALT', 'R2_ACCESS_KEY',
    'GOOGLE_CLOUD_API_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'CRON_SECRET',
    'opaque_provider_config', 'new_setting']) {
    assert.equal(platformSettingDisplayValue(key, 'private-payload'), '••••••••', key);
  }
});
test('only known public scalar settings are readable', () => {
  assert.equal(platformSettingDisplayValue('site_name', 'Elevate for Humanity'), 'Elevate for Humanity');
  assert.equal(platformSettingDisplayValue('sms_notifications', true), 'true');
  assert.equal(platformSettingDisplayValue('session_timeout', 480), '480');
  assert.equal(platformSettingDisplayValue('site_name', { token: 'private-payload' }), '••••••••');
  assert.equal(platformSettingDisplayValue('unknown', null), '—');
  assert.equal(platformSettingDisplayValue('unknown', ''), '');
});
test('Admin sanitizes settings before rendering or passing values onward', () => {
  const page = readFileSync(new URL('../../apps/admin/app/settings/page.tsx', import.meta.url), 'utf8');
  assert.match(page, /value: platformSettingDisplayValue\(row\.key, row\.value\)/);
  assert.doesNotMatch(page, /isSensitiveSetting/);
  assert.match(page, /await requireRole\(\['admin'\]\)/);
});
