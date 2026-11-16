import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writePrivateQaState } from './write-private-state.mjs';

for (const existing of [false, true]) {
  test(`QA password state is private for ${existing ? 'existing' : 'new'} files`, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'qa-private-state-'));
    const path = join(dir, 'state.json');
    const password = randomBytes(24).toString('hex');
    try {
      if (existing) await writeFile(path, 'old', { mode: 0o644 });
      await writePrivateQaState(path, { runId: 'synthetic', password });
      assert.equal((await stat(path)).mode & 0o777, 0o600);
      assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), { runId: 'synthetic', password });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
}


test('interrupted replacement never truncates the last complete private QA checkpoint', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'qa-private-recovery-'));
  const path = join(dir, 'state.json');
  try {
    await writePrivateQaState(path, { host: { id: 'fixture-a' } });
    const invalid = {};
    invalid.circular = invalid;
    await assert.rejects(writePrivateQaState(path, invalid), /circular/i);
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), {
      host: { id: 'fixture-a' },
    });
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    await writePrivateQaState(path, { host: { id: 'fixture-a' }, shopId: 'fixture-shop' });
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), {
      host: { id: 'fixture-a' }, shopId: 'fixture-shop',
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
