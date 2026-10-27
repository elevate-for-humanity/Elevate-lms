import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('Standalone PARIS availability health contract', () => {
  const code = readFileSync('apps/admin/app/api/admin/dev-studio/ai/health/route.ts', 'utf8');
  it('treats the owned model as a valid provider without requiring vendor API keys', () => {
    expect(code).toContain("passed: ownedReady || aiConfigured");
    expect(code).toContain("name: 'paris-owned-inference'");
    expect(code).toContain("passed: ownedReady,");
    expect(code).toContain("required: true,");
  });
});
