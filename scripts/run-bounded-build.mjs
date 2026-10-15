import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { boundedBuildEnvironment, buildMemoryLimitBytes, childExitStatus } from './build-memory-policy.mjs';

const args = process.argv.slice(2);
if (args[0] === '--') args.shift();
if (!args.length) throw new Error('A build or validation command is required.');
const directory = join(tmpdir(), 'elevate-build-locks');
mkdirSync(directory, { recursive: true });
const budget = boundedBuildEnvironment(process.env, buildMemoryLimitBytes());
console.log(`[build-memory] container=${budget.memoryMiB}MiB heap=${budget.heapMiB}MiB; waiting for the shared build/validation slot`);

// A kernel lock works across PID namespaces and releases on crashes. No stale
// PID files, unlocked fallback, or parallel build/typecheck processes.
const child = spawn('flock', ['--exclusive', '--timeout', '1800', '--conflict-exit-code', '75', join(directory, 'memory-intensive.lock'), ...args], {
  env: budget.env, stdio: 'inherit', detached: true,
});
const forward = signal => {
  try { process.kill(-child.pid, signal); } catch (error) { if (error.code !== 'ESRCH') throw error; }
};
const forwardInterrupt = () => forward('SIGINT');
const forwardTerminate = () => forward('SIGTERM');
process.once('SIGINT', forwardInterrupt);
process.once('SIGTERM', forwardTerminate);
child.once('error', error => {
  console.error(error.code === 'ENOENT'
    ? 'The build container requires flock (util-linux); refusing an unbounded build.' : error.message);
  process.exitCode = 1;
});
child.once('exit', (code, signal) => {
  process.removeListener('SIGINT', forwardInterrupt);
  process.removeListener('SIGTERM', forwardTerminate);
  if (code === 75) console.error('Build admission timed out after 30 minutes; another build or validation still owns the slot.');
  process.exitCode = childExitStatus(code, signal);
});
