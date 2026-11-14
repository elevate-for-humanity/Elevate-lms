import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writePrivateQaState } from './write-private-state.mjs';

for (const existing of [false, true]) {
  test(`QA password state is private for ${existing ? 'existing' : 'new'} files`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'qa-private-state-'));
    const path = join(dir, 'state.json');
    try {
      if (existing) await writeFile(path, 'old', { mode: 0o644 });
      await writePrivateQaState(path, { runId: 'synthetic', password: 'test-only-value' });
      assert.equal((await stat(path)).mode & 0o777, 0o600);
      assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), { runId: 'synthetic', password: 'test-only-value' });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}
