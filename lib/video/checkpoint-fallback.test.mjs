import test from 'node:test';
import assert from 'node:assert/strict';
import {storageCapError, createCheckpointFallback} from './checkpoint-fallback.mjs';

test('recognizes production storage cap failures', () => {
  assert.equal(storageCapError(new Error('Cannot upload files, storage cap exceeded. See Caps & Alerts.')), true);
  assert.equal(storageCapError(new Error('transaction cap exceeded')), true);
  assert.equal(storageCapError(new Error('download bandwidth cap exceeded')), true);
  assert.equal(storageCapError(new Error('permission denied')), false);
});

test('preserves bytes and switches to private checkpoint fallback after quota rejection', async () => {
  const saved = new Map();
  const storage = createCheckpointFallback({
    readPrimary: async () => {throw new Error('storage cap exceeded');},
    writePrimary: async () => {throw new Error('Cannot upload files, storage cap exceeded');},
    readFallback: async key => saved.get(key) ?? null,
    writeFallback: async (key,bytes) => {saved.set(key,bytes);},
  });
  const bytes = Buffer.from('valid checkpoint');
  await storage.write('lesson/segment.mp4',bytes);
  assert.equal(storage.usingFallback(),true);
  assert.deepEqual(await storage.read('lesson/segment.mp4'),bytes);
});
