import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archiveGPU, PROFILE } from './gpu-archive.mjs';

function fixture(instances = 0) {
  let payload; const operations = [];
  const data = {
    services: [{ id: 'elevate-gpu-worker' }],
    'services/elevate-gpu-worker': { deployment: { instances } },
    'services/elevate-gpu-worker/runtime-environment?show=all&replaceTemplatedValues=true': {
      runtimeEnvironment: { GPU_WORKER_SECRET: 'sensitive', HF_HOME: '/models/huggingface' }, runtimeFiles: {} },
    volumes: [{ id: 'models' }],
    'volumes/models': { id: 'models', spec: { storageSize: 153600 }, attachedObjects: [{ type: 'service', id: 'elevate-gpu-worker' }] },
  };
  return { operations, options: {
    env: { NORTHFLANK_API_TOKEN: 'source-token' },
    request: async (url, options) => {
      assert.equal(options.method, undefined); // Source inventory is strictly read only.
      return { ok: true, json: async () => ({ data: data[url.split('elevate-media-gpu/')[1]] }) };
    },
    run: (args, input) => {
      operations.push(args);
      if (args[2] === 'list') return '';
      if (args[2] === 'add') { payload = input; return JSON.stringify({ name: 'projects/p/secrets/s/versions/7' }); }
      assert.equal(args[3], '7'); return payload;
    },
  } };
}
test('archives resolved secrets privately, keeps absent LLM absent and refuses volume deletion', async () => {
  const f = fixture(); const result = await archiveGPU(f.options);
  assert.equal(result.services, 1); assert.equal(result.modelBytesTransferred, false);
  assert.equal(result.deletionAllowed, false); assert.equal(PROFILE.computeEnabled, false);
  assert.ok(!JSON.stringify(result).includes('sensitive'));
  assert.ok(f.operations.every(args => args[0] === 'secrets'));
});
test('fails before any Google mutation when source GPU is running or state unknown', async () => {
  for (const count of [1, null]) {
    const f = fixture(count); await assert.rejects(archiveGPU(f.options), /remain stopped/);
    assert.equal(f.operations.length, 0);
  }
});
test('does not silently replace Google-owned archive', async () => {
  const f = fixture(); f.options.run = () => 'existing-version';
  await assert.rejects(archiveGPU(f.options), /already exists/);
});
test('rejects corrupted exact-version readback', async () => {
  const f = fixture(); const run = f.options.run;
  f.options.run = (args, input) => args[2] === 'access' ? '{}' : run(args, input);
  await assert.rejects(archiveGPU(f.options), /readback mismatch/);
});
