import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

const workflow = read('.github/workflows/registered-apprenticeship-e2e.yml');
const job = workflow.slice(workflow.indexOf('\n  production-authenticated-e2e:'));
const creator = read('scripts/qa/provision-remaining-portal-e2e.mjs');
const dependent = read('scripts/qa/provision-learner-program-holder-e2e.mjs');

const LIVE_ROLES = [
  'APPRENTICE',
  'HOST_SHOP',
  'LEARNER',
  'PROGRAM_HOLDER',
  'EMPLOYER',
  'INSTRUCTOR',
  'STAFF',
  'CASE_MANAGER',
  'ADMIN',
];
const FIXTURE_STEPS = [
  'Provision Employer + Instructor + Staff + Case Manager + Admin identities',
  'Provision isolated Learner + Program Holder identities',
  'Provision disposable Host Shop + Apprentice identities',
];
const CLEANUP_STEPS = [
  'Clean disposable Host Shop + Apprentice identities',
  'Clean isolated Learner + Program Holder identities',
  'Clean Employer + Instructor + Staff + Case Manager + Admin identities',
];

function step(name: string) {
  const at = job.indexOf('- name: ' + name);
  expect(at, 'missing protected step: ' + name).toBeGreaterThanOrEqual(0);
  return job.slice(at).split('\n      - name:')[0];
}

describe('live production acceptance never provisions isolated-QA fixtures', () => {
  it('declares the live fixture target so QA fixtures stay inert', () => {
    expect(job).toMatch(/^\s+PORTAL_FIXTURE_TARGET: live-production$/m);
  });

  it.each(FIXTURE_STEPS)('gates %s behind the isolated-QA target', (name) => {
    const block = step(name);
    expect(block).toContain("if: ${{ env.PORTAL_FIXTURE_TARGET == 'isolated-qa' }}");
    expect(block).toMatch(/scripts\/qa\/provision-[a-z0-9-]+\.mjs provision/);
  });

  it.each(CLEANUP_STEPS)('keeps %s pinned and inert for the live target', (name) => {
    const block = step(name);
    expect(block).toContain(
      "if: ${{ always() && steps.install-dependencies.outcome == 'success' }}",
    );
    expect(block).toContain(
      'if [[ "${PORTAL_FIXTURE_TARGET:-live-production}" == "isolated-qa" ]]; then',
    );
    expect(block).toMatch(/scripts\/qa\/provision-[a-z0-9-]+\.mjs cleanup/);
  });
});

describe('live production acceptance requires dedicated live identities', () => {
  it.each(LIVE_ROLES)('maps E2E_%s_EMAIL/PASSWORD from the production account secrets', (role) => {
    expect(job).toMatch(
      new RegExp(`^\\s+E2E_${role}_EMAIL: \\$\\{\\{ secrets\\.PRODUCTION_E2E_${role}_EMAIL \\}\\}$`, 'm'),
    );
    expect(job).toMatch(
      new RegExp(
        `^\\s+E2E_${role}_PASSWORD: \\$\\{\\{ secrets\\.PRODUCTION_E2E_${role}_PASSWORD \\}\\}$`,
        'm',
      ),
    );
  });

  it('never sources live identities from the isolated-QA identity secrets', () => {
    expect(job).not.toMatch(/secrets\.E2E_[A-Z_]+_(EMAIL|PASSWORD)/);
  });

  it('fails closed on missing identities before any authenticated suite runs', () => {
    const gate = job.indexOf('- name: Require all nine roles so authenticated tests cannot silently skip');
    const firstSuite = job.indexOf('- name: Verify authenticated HVAC course video playback');
    expect(gate).toBeGreaterThanOrEqual(0);
    expect(firstSuite).toBeGreaterThan(gate);
    const block = step('Require all nine roles so authenticated tests cannot silently skip');
    expect(block).toContain('node scripts/qa/require-portal-e2e-identities.mjs');
    expect(block).toContain("if [[ \"${EMPLOYER_ONLY}\" == \"true\" ]]");
    expect(block).not.toMatch(/^\s+if: /m);
  });
});

describe('isolated-QA fixture guard is unchanged', () => {
  it.each([
    ['remaining portal', creator],
    ['learner and program holder', dependent],
  ])('%s provisioner still refuses every non-QA host', (_label, source) => {
    expect(source).toContain("qaHostname !== 'isdgjcdabhxxozarmxta.supabase.co'");
    expect(source).toContain("'This fixture may run only against the isolated QA project'");
  });
});
