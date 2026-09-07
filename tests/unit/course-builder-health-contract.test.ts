// @vitest-environment node

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('Course Builder health contract', () => {
  it('uses the canonical provider router instead of a provider-specific key check', () => {
    const route = read('apps/admin/app/api/admin/courses/health/route.ts');
    expect(route).toContain('isAIAvailable()');
    expect(route).toContain('getActiveProviderName()');
    expect(route).not.toContain('process.env.OPENAI_API_KEY');
    expect(route).not.toContain('process.env.ANTHROPIC_API_KEY');
  });

  it('returns actionable defects for every invalid published course', () => {
    const route = read('apps/admin/app/api/admin/courses/health/route.ts');
    expect(route).toContain("issues.push('canonical program missing')");
    expect(route).toContain("issues.push('canonical modules missing')");
    expect(route).toContain("issues.push('canonical lessons missing')");
    expect(route).toContain("issues.push('duration must be greater than zero')");

    const studio = read('components/admin/course-builder/UnifiedCourseBuilder.tsx');
    expect(studio).toContain('check.issues?.length');
    expect(studio).toContain('Open {issue.title}');
  });
});
