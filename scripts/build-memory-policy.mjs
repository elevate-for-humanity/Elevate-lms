import { readFileSync } from 'node:fs';
import { constants, totalmem } from 'node:os';

export const childExitStatus = (code, signal) => code ?? (128 + (constants.signals[signal] ?? 1));

// All Next.js containers, including new app configs, share this preset.
export const nextBuildMemoryDefaults = Object.freeze({
  cpus: 1,
  webpackBuildWorker: true,
  webpackMemoryOptimizations: true,
  workerThreads: false,
  parallelServerCompiles: false,
  parallelServerBuildTraces: false,
});

export function withBuildMemoryDefaults(config = {}) {
  return {
    ...config,
    experimental: { ...config.experimental, ...nextBuildMemoryDefaults },
    // The canonical build command runs tsc in a fresh process AFTER Next exits.
    // Direct Next invocations still validate types. No production build can
    // report success through the canonical command before the postcheck passes.
    typescript: { ...config.typescript,
      ignoreBuildErrors: process.env.ELEVATE_SEQUENTIAL_TYPECHECK === '1' },
  };
}

export function buildMemoryLimitBytes({ physicalBytes = totalmem(),
  constrainedBytes = process.constrainedMemory?.(), read = readFileSync } = {}) {
  const limits = [physicalBytes];
  if (Number.isFinite(constrainedBytes) && constrainedBytes > 0) limits.push(constrainedBytes);
  for (const path of ['/sys/fs/cgroup/memory.max', '/sys/fs/cgroup/memory.high',
    '/sys/fs/cgroup/memory/memory.limit_in_bytes']) {
    try {
      const value = Number(String(read(path, 'utf8')).trim());
      if (Number.isFinite(value) && value > 0) limits.push(value);
    } catch { /* Non-Linux and cgroup-version-specific files may be absent. */ }
  }
  return Math.min(...limits);
}

export function boundedBuildEnvironment(env, memoryBytes) {
  const memoryMiB = Math.floor(memoryBytes / 2 ** 20);
  if (!Number.isFinite(memoryMiB) || memoryMiB < 4096)
    throw new Error('This repository needs a build container with at least 4 GiB RAM. Storage does not increase build RAM.');
  // Leave room for compiler subprocesses, native allocations and the OS.
  const cap = Math.min(6144, Math.floor(memoryMiB * 0.625));
  const options = String(env.NODE_OPTIONS ?? '');
  const matches = [...options.matchAll(/--max[-_]old[-_]space[-_]size(?:=|\s+)(\d+)/g)];
  const requested = matches.length ? Number(matches.at(-1)[1]) : cap;
  const heapMiB = Math.min(requested, cap);
  if (heapMiB < 1024) throw new Error('Build heap must be at least 1024 MiB.');
  const retained = options.replace(/--max[-_]old[-_]space[-_]size(?:=|\s+)\d+/g, '').trim();
  return { heapMiB, memoryMiB, env: {
    ...env,
    NODE_OPTIONS: `${retained}${retained ? ' ' : ''}--max-old-space-size=${heapMiB}`,
    NEXT_TELEMETRY_DISABLED: '1',
  } };
}
