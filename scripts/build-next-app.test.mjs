import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildNextApp } from './build-next-app.mjs';

test('compilation exits before generated-route type checking starts', async () => {
  const calls = [];
  let running = false;
  const code = await buildNextApp({ env: { KEEP: 'value' }, args: ['--no-lint'], execute: async (command, args, env) => {
    assert.equal(running, false);
    running = true;
    await Promise.resolve();
    calls.push({ command, args, env });
    running = false;
    return 0;
  } });
  assert.equal(code, 0);
  assert.equal(calls.length, 2);
  assert.ok(calls[0].args.includes('build'));
  assert.ok(calls[0].args.includes('--no-lint'));
  assert.equal(calls[0].env.ELEVATE_SEQUENTIAL_TYPECHECK, '1');
  assert.equal(calls[1].env.ELEVATE_SEQUENTIAL_TYPECHECK, '0');
  assert.ok(calls[1].args.includes('--noEmit'));
  assert.equal(calls[1].env.KEEP, 'value');
});

test('failed compilation stops the release sequence', async () => {
  let calls = 0;
  const code = await buildNextApp({ execute: async () => { calls++; return 9; } });
  assert.equal(code, 9);
  assert.equal(calls, 1);
});

test('type errors still fail the complete production build', async () => {
  let calls = 0;
  const code = await buildNextApp({ execute: async () => ++calls === 1 ? 0 : 2 });
  assert.equal(code, 2);
  assert.equal(calls, 2);
});
