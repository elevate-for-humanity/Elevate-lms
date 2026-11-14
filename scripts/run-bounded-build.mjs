import { mkdirSync, statfsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { boundedBuildEnvironment, buildMemoryLimitBytes, childExitStatus } from './build-memory-policy.mjs';

export function verifyBuildDisk({ availableBytes, requiredBytes = 4 * 1024 ** 3 }) {
  if (!Number.isFinite(availableBytes) || availableBytes < requiredBytes) {
    throw Error(`Build disk has ${Math.max(0, Math.floor(availableBytes / 1024 ** 2))} MiB available; at least ${requiredBytes / 1024 ** 3} GiB is required. Clear completed local build outputs before retrying.`);
  }
}

export function runBoundedBuild(argv = process.argv.slice(2)) {
  const args = [...argv];
  const insideSlot = args[0] === '--inside-slot';
  if (insideSlot || args[0] === '--') args.shift();
  if (!args.length) throw new Error('A build or validation command is required.');
  let child;
  if (insideSlot) {
    const disk = statfsSync(process.cwd());
    verifyBuildDisk({ availableBytes: disk.bavail * disk.bsize });
    console.log('[build-memory] shared validation slot acquired; disk capacity verified');
    child = spawn(args[0], args.slice(1), { env: process.env, stdio: 'inherit' });
  } else {
    const directory = join(tmpdir(), 'elevate-build-locks');
    mkdirSync(directory, { recursive: true });
    const budget = boundedBuildEnvironment(process.env, buildMemoryLimitBytes());
    console.log(`[build-memory] container=${budget.memoryMiB}MiB heap=${budget.heapMiB}MiB; waiting for the shared build/validation slot`);
    // Kernel ownership survives PID namespaces and releases on crashes. The
    // same script runs under flock so Docker needs no additional copied helper.
    child = spawn('flock', ['--exclusive', '--timeout', '1800', '--conflict-exit-code', '75',
      join(directory, 'memory-intensive.lock'), process.execPath, fileURLToPath(import.meta.url), '--inside-slot', ...args],
    { env: budget.env, stdio: 'inherit', detached: true });
  }
  const forward = signal => {
    try { process.kill(insideSlot ? child.pid : -child.pid, signal); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
  };
  const interrupt = () => forward('SIGINT');
  const terminate = () => forward('SIGTERM');
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', terminate);
  child.once('error', error => {
    console.error(error.code === 'ENOENT' ? 'Build command or flock is unavailable; validation did not run.' : error.message);
    process.exitCode = 1;
  });
  child.once('exit', (code, signal) => {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', terminate);
    if (!insideSlot && code === 75) console.error('Build admission timed out after 30 minutes; another build or validation still owns the slot.');
    process.exitCode = childExitStatus(code, signal);
  });
  return child;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { runBoundedBuild(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
