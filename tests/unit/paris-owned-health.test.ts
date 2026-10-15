import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('PARIS owned-runtime readiness', () => {
  const source = readFileSync('apps/admin/app/api/admin/dev-studio/ai/health/route.ts', 'utf8');
  it('requires an authenticated model readback rather than mistaking vendor API keys for readiness', () => {
    expect(source).toContain("name: 'paris-owned-inference'");
    expect(source).toContain("ownedReady");
    expect(source).toContain("response.ok");
    expect(source).toContain("model.id === 'elevate-local'");
    expect(source).toContain("Authorization:");
  });
  it('does not enable or create GPU resources from the health endpoint', () => {
    expect(source).not.toContain('gcloud run deploy');
    expect(source).not.toContain('activateGPU');
  });
});
