import test from 'node:test';
import assert from 'node:assert/strict';
import { PassThrough } from 'node:stream';
import { mkdtemp, writeFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PipeConnection, launchConnection } from './cdp-transport.mjs';

function fixture(options = {}) {
  const readable = new PassThrough();
  const writable = new PassThrough();
  const frames = [];
  writable.on('data', (data) => frames.push(JSON.parse(data.toString().replace(/\0$/, ''))));
  const connection = new PipeConnection({ readable, writable, ...options });
  const reply = (object) => readable.write(JSON.stringify(object) + '\0');
  return { connection, readable, writable, frames, reply };
}

test('multiplexes flattened sessions and receives fragmented events', async () => {
  const f = fixture();
  const a = f.connection.send('Runtime.evaluate', { expression: '1' }, 'a');
  const b = f.connection.send('Runtime.evaluate', { expression: '2' }, 'b');
  f.reply({ id: f.frames[1].id, sessionId: 'b', result: { value: 2 } });
  f.reply({ id: f.frames[0].id, sessionId: 'a', result: { value: 1 } });
  assert.deepEqual(await a, { value: 1 });
  assert.deepEqual(await b, { value: 2 });
  const events = [];
  f.connection.on('event', (event) => events.push(event));
  f.readable.write('{"method":"Page.');
  f.readable.write('loadEventFired","sessionId":"a","params":{}}\0');
  assert.equal(events[0].sessionId, 'a');
  f.connection.close();
});

test('timeouts do not replay commands or accept late replies', async () => {
  const f = fixture({ defaultTimeoutMs: 5 });
  await assert.rejects(f.connection.send('Input.insertText'), /timed out/);
  f.reply({ id: 1, result: {} });
  assert.equal(f.frames.length, 1);
  assert.equal(f.connection.pending.size, 0);
  f.connection.close();
});

test('disconnect rejects all commands exactly once', async () => {
  const f = fixture();
  let disconnects = 0;
  f.connection.on('disconnected', () => disconnects++);
  const result = assert.rejects(f.connection.send('Page.navigate'), /disconnected/);
  f.connection.close();
  f.connection.close();
  await result;
  assert.equal(disconnects, 1);
  await assert.rejects(f.connection.send('Page.reload'), /closed/);
});

test('bounds pending commands and incoming messages', async () => {
  const f = fixture({ maxPending: 1, maxMessageBytes: 128 });
  const pending = assert.rejects(f.connection.send('Page.reload'), /size limit/);
  await assert.rejects(f.connection.send('Page.reload'), /pending command limit/);
  f.readable.write('x'.repeat(129));
  await pending;
  assert.equal(f.connection.connected, false);
});

test('rejects session-mismatched responses and redacts protocol errors', async () => {
  const f = fixture();
  const pending = assert.rejects(
    f.connection.send('Runtime.evaluate', {}, 'a'),
    /session mismatch/,
  );
  f.reply({ id: 1, sessionId: 'b', result: {} });
  await pending;
  const g = fixture();
  const rejected = assert.rejects(
    g.connection.send('Page.navigate'),
    (error) => error.message === 'CDP command failed (-1)',
  );
  g.reply({ id: 1, error: { code: -1, message: 'sensitive text' } });
  await rejected;
  g.connection.close();
});

test('launch rejects debugging or profile overrides', async () => {
  for (const argument of [
    '--remote-debugging-port=9222',
    '--remote-debugging-pipe',
    '--user-data-dir=/tmp/shared',
    '--profile-directory=Default',
  ]) {
    await assert.rejects(
      launchConnection({ executablePath: '/unused', args: [argument] }),
      /may not override/,
    );
  }
});

test('missing executable fails promptly and cleans up', async () => {
  await assert.rejects(
    launchConnection({ executablePath: '/nonexistent/studio-chromium', launchTimeoutMs: 100 }),
    /failed to launch/,
  );
});

test('launch uses pipe, isolated profile, and cleans profile after close', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fake-chromium-'));
  const executable = join(directory, 'browser');
  await writeFile(
    executable,
    `#!/usr/bin/env node
const fs = require('node:fs');
const input = fs.createReadStream(null, { fd: 3 });
let buffer = '';
input.on('data', chunk => {
  buffer += chunk.toString();
  let end;
  while ((end = buffer.indexOf('\\0')) !== -1) {
    const request = JSON.parse(buffer.slice(0, end));
    buffer = buffer.slice(end + 1);
    fs.writeSync(4, JSON.stringify({ id: request.id, result: { product: 'Fake/1' } }) + '\\0');
  }
});
`,
    { mode: 0o700 },
  );
  let browser;
  try {
    browser = await launchConnection({ executablePath: executable, launchTimeoutMs: 2000 });
    assert.equal(browser.connection.connected, true);
    const args = browser.process.spawnargs;
    assert.ok(args.includes('--remote-debugging-pipe'));
    assert.equal(
      args.some((arg) => arg.startsWith('--remote-debugging-port')),
      false,
    );
    const profile = args
      .find((arg) => arg.startsWith('--user-data-dir='))
      .slice('--user-data-dir='.length);
    await access(profile);
    await Promise.all([browser.close(), browser.close()]);
    await assert.rejects(access(profile), { code: 'ENOENT' });
  } finally {
    await browser?.close();
    await rm(directory, { recursive: true, force: true });
  }
});
