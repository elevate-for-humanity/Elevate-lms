import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const scripts = [
  'provision-remaining-portal-e2e.mjs',
  'provision-learner-program-holder-e2e.mjs',
  'provision-apprenticeship-e2e.mjs',
];

const PRODUCTION_URL = 'https://cuxzzpsyufcewtmicszk.supabase.co';
const QA_URL = 'https://isdgjcdabhxxozarmxta.supabase.co';
const OTHER_URL = 'https://example.supabase.co';
const GUARD_MESSAGE = 'only against the isolated QA project';

/**
 * Run a provision script as a subprocess with a fake service key. The fake
 * key means nothing is ever created: with the guard in the way the script
 * exits at the guard; past the guard it fails at the first Supabase call.
 * The parent environment's real credentials are never inherited.
 */
function runScript(script, extraEnv) {
  return spawnSync(process.execPath, [join(scriptsDir, script), 'provision'], {
    cwd: scriptsDir,
    timeout: 30_000,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH || '',
      NEXT_PUBLIC_SUPABASE_URL: PRODUCTION_URL,
      SUPABASE_SERVICE_ROLE_KEY: 'test-key',
      ...extraEnv,
    },
  });
}

function output(result) {
  return `${result.stdout || ''}\n${result.stderr || ''}`;
}

for (const script of scripts) {
  test(`${script}: production host is rejected without the opt-in flag`, () => {
    const result = runScript(script, {});
    assert.notEqual(result.status, 0, `${script} should fail without the flag`);
    assert.ok(
      output(result).includes(GUARD_MESSAGE),
      `${script} should fail at the guard without the flag`,
    );
  });

  test(`${script}: production host is allowed with the opt-in flag`, () => {
    const result = runScript(script, { QA_E2E_ALLOW_PRODUCTION_DISPOSABLES: '1' });
    assert.notEqual(result.status, 0, `${script} should fail with a fake key`);
    assert.ok(
      !output(result).includes(GUARD_MESSAGE),
      `${script} should pass the guard with the flag`,
    );
    // It must fail downstream (bad key / unreachable project), never silently pass.
    assert.match(output(result), /anchor|load|Invalid API key|401|fetch/i);
  });

  test(`${script}: any other host is rejected even with the opt-in flag`, () => {
    const result = runScript(script, {
      NEXT_PUBLIC_SUPABASE_URL: OTHER_URL,
      QA_E2E_ALLOW_PRODUCTION_DISPOSABLES: '1',
    });
    assert.notEqual(result.status, 0, `${script} should fail for an unknown host`);
    assert.ok(
      output(result).includes(GUARD_MESSAGE),
      `${script} should reject a non-QA, non-production host even with the flag`,
    );
  });

  test(`${script}: the isolated QA project still works without the flag`, () => {
    const result = runScript(script, { NEXT_PUBLIC_SUPABASE_URL: QA_URL });
    assert.notEqual(result.status, 0, `${script} should fail with a fake key`);
    assert.ok(
      !output(result).includes(GUARD_MESSAGE),
      `${script} should pass the guard for the QA project without the flag`,
    );
    assert.match(output(result), /anchor|load|Invalid API key|401|fetch/i);
  });
}
