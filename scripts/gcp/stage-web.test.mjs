import test from 'node:test';
import assert from 'node:assert/strict';
import { runtimeForGoogle } from './stage-web.mjs';
const base = () => ({ runtimeEnvironment: { NEXT_PUBLIC_SUPABASE_URL: 'https://cuxzzpsyufcewtmicszk.supabase.co', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-public', SUPABASE_SERVICE_ROLE_KEY: 'test-private', PORT: '3000', MULTILINE: 'one\ntwo', QUOTED: 'a,b="c"' } });
test('preserves runtime values without modifying source and removes reserved port', () => {
  const source = base();
  const env = runtimeForGoogle(source, {});
  assert.equal(env.MULTILINE, 'one\ntwo');
  assert.equal(env.QUOTED, 'a,b="c"');
  assert.equal(env.SUPABASE_SERVICE_ROLE_KEY, 'test-private');
  assert.equal(env.PORT, undefined);
  assert.equal(source.runtimeEnvironment.PORT, '3000');
});
test('rejects incomplete or wrong database configuration', () => {
  const source = base(); delete source.runtimeEnvironment.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(() => runtimeForGoogle(source, {}), /missing/);
  source.runtimeEnvironment.NEXT_PUBLIC_SUPABASE_URL = 'https://other.supabase.co';
  assert.throws(() => runtimeForGoogle(source, {}), /Unexpected/);
});
test('does not silently lose persistent data, secret files or unresolved templates', () => {
  assert.throws(() => runtimeForGoogle(base(), { deployment: { volumes: [{}] } }), /volumes/);
  assert.throws(() => runtimeForGoogle({ ...base(), runtimeFiles: { '/secret': {} } }, {}), /files/);
  const source = base(); source.runtimeEnvironment.SECRET = '${unresolved}';
  assert.throws(() => runtimeForGoogle(source, {}), /Unresolved/);
});
