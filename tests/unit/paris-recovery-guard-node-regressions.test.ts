import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('runs PARIS recovery disposition and configured monitor guards in required CI', () => {
  const report = execFileSync(process.execPath, [
    '--test-reporter=tap', '--test',
    'tests/worker/paris-monitor-config.test.mjs',
    'tests/worker/paris-repair-disposition-contract.test.mjs',
  ], { encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024 });
  expect(report).toContain('# fail 0');
}, 40000);
