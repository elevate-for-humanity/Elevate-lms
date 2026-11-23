import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import marketingConfig from '../../apps/marketing/next.config.mjs';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('marketing build warning boundary', () => {
  const originalCacheFlag = process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE;
  beforeEach(() => { delete process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE; });
  afterEach(() => {
    if (originalCacheFlag === undefined) delete process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE;
    else process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE = originalCacheFlag;
  });
  it('does not skip lint or TypeScript validation in production builds', () => {
    const pkg = JSON.parse(read('apps/marketing/package.json')) as { scripts: { build: string } };
    const config = read('apps/marketing/next.config.mjs');
    expect(pkg.scripts.build).not.toContain('--no-lint');
    expect(config).not.toContain('ignoreBuildErrors: true');
    expect(config).not.toContain('ignoreDuringBuilds: true');
  });

  it('externalizes server instrumentation that uses dynamic requires', () => {
    const config = read('apps/marketing/next.config.mjs');
    expect(config).toContain("'@opentelemetry/instrumentation'");
    expect(config).toContain("'require-in-the-middle'");
    expect(config).toContain("'@sentry/node'");
    // Production builds use Next-managed cache; the previous unconditional
    // cache disable was removed deliberately. The real contract is bounded
    // webpack parallelism with no ignored build diagnostics.
    expect(config).toContain('config.parallelism = 1');
    expect(config).toContain('return config;');
    expect(config).not.toContain('if (!dev) config.cache = false');
    expect(config).not.toContain('config.ignoreWarnings');
  });

  it('preserves the production cache selected by Next.js', () => {
    const cache = { type: 'filesystem', name: 'production-server' };
    const config = { cache, plugins: [], resolve: {} };
    const result = marketingConfig.webpack(config, { dev: false, isServer: true });
    expect(result.cache).toBe(cache);
    expect(result.parallelism).toBe(1);
  });

  it('allows bounded builders to disable cache without changing compilation diagnostics', () => {
    const previous = process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE;
    process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE = '1';
    try {
      const result = marketingConfig.webpack({ cache: { type: 'filesystem' }, plugins: [], resolve: {} }, { dev: false, isServer: true });
      expect(result.cache).toBe(false);
      expect(result.parallelism).toBe(1);
      expect(marketingConfig.typescript.ignoreBuildErrors).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE;
      else process.env.DISABLE_WEBPACK_FILESYSTEM_CACHE = previous;
    }
  });

  it('bounds build concurrency for standalone metadata generation', () => {
    expect(marketingConfig.experimental).toMatchObject({
      cpus: 1, webpackBuildWorker: true, webpackMemoryOptimizations: true,
      parallelServerCompiles: false, parallelServerBuildTraces: false,
    });
    expect(marketingConfig.typescript.ignoreBuildErrors).toBe(false);
  });
});
