import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

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
    expect(config).toContain('if (!dev) config.cache = false');
    expect(config).not.toContain('config.ignoreWarnings');
  });
});
