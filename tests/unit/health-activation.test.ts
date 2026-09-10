import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production health endpoint', () => {
  it('does not advertise hardcoded fake production scores', () => {
    const src = readFileSync(join(process.cwd(), 'apps/marketing/app/api/health/route.ts'), 'utf8');
    expect(src).not.toContain('10/10');
    expect(src).not.toContain('overall_score');
    expect(src).toContain("healthContract: 'marketing-v4'");
    expect(src).toContain('dependencies');
  });

  it('exposes a lightweight readiness route', () => {
    const src = readFileSync(join(process.cwd(), 'apps/marketing/app/api/ready/route.ts'), 'utf8');
    expect(src).toContain('ready');
    expect(src).not.toContain('getPublicUrl');
  });

  it('keeps readiness public so deployment probes are not redirected to login', () => {
    const middleware = readFileSync(join(process.cwd(), 'apps/marketing/middleware.ts'), 'utf8');
    expect(middleware).not.toMatch(/PROTECTED_PORTAL_PREFIXES[\s\S]*['"]\/api\/ready['"]/);
  });
});
