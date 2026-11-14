'use client';

import { Buffer } from 'buffer';

type BrowserProcess = {
  browser: true;
  env: Record<string, string | undefined>;
  version: string;
  versions: Record<string, string>;
  cwd: () => string;
  nextTick: (callback: (...args: unknown[]) => void, ...args: unknown[]) => void;
};

type BrowserRuntime = {
  Buffer?: typeof Buffer;
  buffer?: { Buffer: typeof Buffer };
  process?: BrowserProcess;
};

const browserProcess: BrowserProcess = {
  browser: true,
  env: {},
  version: '',
  versions: {},
  cwd: () => '/',
  nextTick: (callback, ...args) => queueMicrotask(() => callback(...args)),
};

/**
 * Installs the browser globals required by client-side vendor packages.
 * This is idempotent because both Next's instrumentation entrypoint and the
 * root layout can execute during different browser bootstrap paths.
 */
export function installBrowserRuntimePolyfills() {
  const runtime = globalThis as unknown as BrowserRuntime;
  runtime.Buffer ??= Buffer;
  runtime.buffer ??= { Buffer };
  runtime.process ??= browserProcess;
}
