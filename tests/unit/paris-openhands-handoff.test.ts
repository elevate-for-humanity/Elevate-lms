import {execFileSync} from 'node:child_process';
import {expect, it} from 'vitest';

it('preserves durable OpenHands dispatch, approval, ownership and immutable repair readback contracts', () => {
  expect(() => execFileSync(process.execPath, ['--test', 'tests/worker/paris-openhands-handoff.test.mjs','lib/ai/runtime/deployment-repair-events.test.mjs'], {
    cwd: process.cwd(), encoding: 'utf8', timeout: 30_000,
  })).not.toThrow();
});
