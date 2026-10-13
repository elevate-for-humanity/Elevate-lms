import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

test(
  'production HTTP service passes every foundation check through native CDP',
  {
    skip: !process.env.STUDIO_BROWSER_EXECUTABLE_PATH,
    timeout: 120000,
  },
  async () => {
    const reservation = net.createServer();
    reservation.listen(0, '127.0.0.1');
    await once(reservation, 'listening');
    const port = reservation.address().port;
    await new Promise((resolve) => reservation.close(resolve));
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'cdp-foundation-'));
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL('./server.mjs', import.meta.url))],
      {
        env: {
          ...process.env,
          PORT: String(port),
          STUDIO_BROWSER_SECRET: 'local-fixture-only',
          STUDIO_BROWSER_AUTH_STATE_DIR: directory,
        },
        stdio: ['ignore', 'ignore', 'pipe'],
      },
    );
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString().slice(0, 2000);
    });
    const base = `http://127.0.0.1:${port}`;
    try {
      let ready = false;
      for (let i = 0; i < 100; i++) {
        if (child.exitCode !== null) throw new Error(`Service exited: ${stderr}`);
        const response = await fetch(base + '/health').catch(() => null);
        if (response?.ok) {
          const health = await response.json();
          assert.equal(health.engine, 'direct-cdp-chromium');
          ready = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      assert.equal(ready, true, 'Chromium service must become ready');
      assert.equal((await fetch(base + '/foundation-test', { method: 'POST' })).status, 401);
      const response = await fetch(base + '/foundation-test', {
        method: 'POST',
        headers: { 'x-studio-browser-secret': 'local-fixture-only' },
        signal: AbortSignal.timeout(100000),
      });
      const evidence = await response.json();
      assert.equal(response.status, 200, JSON.stringify(evidence.checks));
      assert.equal(evidence.passed, true, JSON.stringify(evidence.checks));
      assert.equal(evidence.checks.length, 14);
      assert.ok(evidence.checks.every((check) => check.passed === true));
    } finally {
      child.kill('SIGTERM');
      const force = setTimeout(() => child.kill('SIGKILL'), 4000);
      if (child.exitCode === null) await once(child, 'exit');
      clearTimeout(force);
      await fs.rm(directory, { recursive: true, force: true });
    }
  },
);
