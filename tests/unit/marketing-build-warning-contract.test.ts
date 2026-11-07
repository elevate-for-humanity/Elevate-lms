import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import marketingConfig from '../../apps/marketing/next.config.mjs';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

describe('marketing build warning boundary', () => {
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
    expect(config).not.toContain('config.ignoreWarnings');
  });

  it('preserves the production cache selected by Next.js', () => {
    const cache = { type: 'filesystem', name: 'production-server' };
    const config = { cache, plugins: [], resolve: {} };
    const result = marketingConfig.webpack(config, { dev: false, isServer: true });
    expect(result.cache).toBe(cache);
    expect(result.parallelism).toBe(1);
  });

  it('bounds build concurrency for standalone metadata generation', () => {
    expect(marketingConfig.experimental).toMatchObject({
      cpus: 1, webpackBuildWorker: true, webpackMemoryOptimizations: true,
      parallelServerCompiles: false, parallelServerBuildTraces: false,
    });
    expect(marketingConfig.typescript.ignoreBuildErrors).toBe(false);
  });
});
