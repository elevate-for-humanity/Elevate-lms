import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { privateCheckpointStorage } from '../../lib/video/checkpoint-fallback.mjs';

test('production storyboard renderer retains checkpoint recovery and requires external storage for new video writes', async () => {
  const source = readFileSync(new URL('../../lib/video/remotion-render.ts', import.meta.url), 'utf8');
  assert.ok(source.length > 40000);
  assert.ok(source.includes('export async function renderStoryboardVideo'));

  // Compile the real TypeScript rather than accepting a disconnected mock.
  const transformed = stripTypeScriptTypes(source, { mode: 'transform' });
  assert.ok(transformed.includes('createCheckpointFallback'));
  assert.ok(transformed.includes('await renderMedia('));
  assert.ok(transformed.includes('getElevateMediaStorageClient()'));
  assert.ok(transformed.includes('checkpoints.write('));

  // The legacy private checkpoint store supports reads only. A storage-cap
  // fallback must never silently create a new uncertified video in Supabase.
  const privateStorage = privateCheckpointStorage({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.invalid',
      SUPABASE_SERVICE_ROLE_KEY: 'local-test-value',
    },
  });
  await assert.rejects(
    privateStorage.write('checkpoint.mp4', Buffer.from('video')),
    /COURSE_VIDEO_EXTERNAL_STORAGE_REQUIRED/,
  );
});
